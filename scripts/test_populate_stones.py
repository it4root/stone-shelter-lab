"""Verify the loader's HTTP behavior against an isolated local HTTP server."""

from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from threading import Thread
import unittest
from uuid import uuid4


SCRIPT = Path(__file__).with_name("populate_stones.py")
module_spec = importlib.util.spec_from_file_location("populate_stones", SCRIPT)
loader = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(loader)


@contextmanager
def api(fail_creation=False):
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            body = self.rfile.read(int(self.headers["Content-Length"]))
            requests.append((self.path, self.headers["Content-Type"], body))
            status = 400 if fail_creation and self.path == "/api/v1/stones" else 201
            response = {"status": 400, "detail": "Invalid stone"} if status == 400 else {"id": str(uuid4())}
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}", requests
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


class PopulateStonesTest(unittest.TestCase):
    def invoke(self, url, root):
        return subprocess.run([sys.executable, str(SCRIPT), "--base-url", url, "--image-root", str(root)],
                              capture_output=True, text=True, timeout=15)

    def images(self, root, count=2, stone_type="Basalt"):
        folder = root / stone_type
        folder.mkdir()
        for index in range(1, count + 1):
            (folder / f"{index:02d}.png").write_bytes(f"image-{index}".encode())
        return folder

    def test_only_numbered_tiles_are_uploaded_in_numeric_order_before_creation(self):
        with TemporaryDirectory() as directory, api() as (url, requests):
            root = Path(directory)
            self.images(root)
            (root / "Basalt.png").write_bytes(b"composite")
            result = self.invoke(url, root)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual([route for route, _, _ in requests],
                             ["/api/v1/stone-photo-drafts", "/api/v1/stone-photo-drafts", "/api/v1/stones"])
            self.assertIn(b'filename="01.png"', requests[0][2])
            self.assertIn(b'filename="02.png"', requests[1][2])
            self.assertNotIn(b"composite", b"".join(body for _, _, body in requests))
            payload = json.loads(requests[2][2])
            self.assertEqual(payload["stoneType"], "BASALT")
            self.assertEqual(payload["adoptionStatus"], "AVAILABLE")
            self.assertNotIn("admissionDate", payload)
            self.assertEqual(len(payload["photoUploadIds"]), 2)

    def test_all_input_is_validated_before_any_mutation(self):
        for folder, count in [("Unknown", 1), ("Basalt", 17), ("Basalt", 0)]:
            with self.subTest(folder=folder, count=count), TemporaryDirectory() as directory, api() as (url, requests):
                root = Path(directory)
                self.images(root, count, folder)
                result = self.invoke(url, root)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(requests, [])
        result = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("--base-url", result.stderr)

    def test_creation_failure_reports_reusable_references_without_reupload(self):
        with TemporaryDirectory() as directory, api(fail_creation=True) as (url, requests):
            root = Path(directory)
            self.images(root)
            result = self.invoke(url, root)
            self.assertEqual(result.returncode, 1)
            report = json.loads(result.stderr)
            self.assertEqual(report["stage"], "create")
            self.assertEqual(len(report["uploadedPhotoIds"]), 2)
            self.assertEqual(report["uploadedPhotoIds"], report["stoneRequest"]["photoUploadIds"])
            self.assertEqual(len(requests), 3)
            self.assertNotIn("Completed", result.stdout)

    def test_supplied_dataset_has_ten_stones_and_124_tiles(self):
        fixtures = loader.dataset(loader.DEFAULT_IMAGES)
        self.assertEqual(len(fixtures), 10)
        self.assertEqual(sum(len(images) for _, images in fixtures), 124)
        self.assertEqual(len(dict(fixtures)["LIMESTONE"]), 16)


if __name__ == "__main__":
    unittest.main()
