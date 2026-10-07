#!/usr/bin/env python3
"""Populate an explicitly selected backend using its public draft/creation API."""

import argparse
import json
import mimetypes
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from uuid import uuid4


STONE_TYPES = {
    "BASALT", "GRANITE", "OBSIDIAN", "PUMICE", "LIMESTONE",
    "SANDSTONE", "SHALE", "MARBLE", "GNEISS", "SLATE",
}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}
DEFAULT_IMAGES = Path(__file__).resolve().parents[1] / "specs/0008-add-stone-api/stone_test_img"


class ApiError(RuntimeError):
    """An unsuccessful or malformed API response; never retried automatically."""


def dataset(image_root):
    """Validate every local folder before the first HTTP mutation."""
    if not image_root.is_dir():
        raise ValueError(f"Image directory does not exist: {image_root}")
    result = []
    for folder in sorted(path for path in image_root.iterdir() if path.is_dir()):
        stone_type = folder.name.upper()
        if stone_type not in STONE_TYPES:
            raise ValueError(f"Unknown stone type folder: {folder.name}")
        images = [path for path in folder.iterdir() if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES]
        if not 1 <= len(images) <= 16:
            raise ValueError(f"{folder.name} must contain 1 to 16 photographs, found {len(images)}")
        if any(not path.stem.isdigit() or int(path.stem) < 1 for path in images):
            raise ValueError(f"{folder.name} must use positive numeric image filenames")
        if len({int(path.stem) for path in images}) != len(images):
            raise ValueError(f"{folder.name} contains duplicate numeric image positions")
        for image in images:
            if not 0 < image.stat().st_size <= 10 * 1024 * 1024:
                raise ValueError(f"Image must contain at most 10 MiB of nonempty data: {image}")
        result.append((stone_type, sorted(images, key=lambda path: int(path.stem))))
    if not result:
        raise ValueError("No stone type folders found")
    return result


def post(base_url, route, body, content_type):
    request = Request(base_url + route, data=body, method="POST",
                      headers={"Content-Type": content_type, "Accept": "application/json"})
    try:
        with urlopen(request, timeout=60) as response:
            if response.status != 201:
                raise ApiError(f"{route}: expected HTTP 201, received {response.status}")
            data = json.loads(response.read())
            if not isinstance(data, dict) or "id" not in data:
                raise ApiError(f"{route}: response has no resource identifier")
            return data
    except HTTPError as error:
        raise ApiError(f"{route}: HTTP {error.code}: {error.read().decode('utf-8', errors='replace')}") from error
    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as error:
        raise ApiError(f"{route}: {error}") from error


def upload(base_url, image):
    boundary = "stone-shelter-" + uuid4().hex
    media_type = mimetypes.guess_type(image.name)[0]
    prefix = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
              f"filename=\"{image.name}\"\r\nContent-Type: {media_type}\r\n\r\n").encode()
    body = prefix + image.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    return post(base_url, "/api/v1/stone-photo-drafts", body,
                f"multipart/form-data; boundary={boundary}")["id"]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True, help="Explicit target backend origin, for example http://localhost:8080")
    parser.add_argument("--image-root", type=Path, default=DEFAULT_IMAGES, help="Directory containing stone type tile folders")
    args = parser.parse_args(argv)
    base_url = args.base_url.rstrip("/")
    parsed = urlparse(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.query or parsed.fragment or parsed.username or parsed.password:
        parser.error("--base-url must be an HTTP(S) backend URL without credentials, query or fragment")
    try:
        fixtures = dataset(args.image_root)
    except (ValueError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1

    total_photos = sum(len(images) for _, images in fixtures)
    print(f"Target: {base_url}; {len(fixtures)} stones, {total_photos} photographs", flush=True)
    for index, (stone_type, images) in enumerate(fixtures):
        stone = {
            "name": f"Test {stone_type.title()}",
            "stoneType": stone_type,
            "stoneSize": ("SMALL", "MEDIUM", "LARGE")[index % 3],
            "adoptionStatus": "AVAILABLE",
            "biography": f"API fixture stone for {stone_type.title()}.",
            "photoUploadIds": [],
        }
        stage = "upload"
        try:
            for image in images:
                stone["photoUploadIds"].append(upload(base_url, image))
            stage = "create"
            created = post(base_url, "/api/v1/stones", json.dumps(stone).encode(), "application/json")
        except (ApiError, OSError) as error:
            print(json.dumps({"error": str(error), "stage": stage, "stoneRequest": stone,
                              "uploadedPhotoIds": stone["photoUploadIds"]}, indent=2), file=sys.stderr)
            return 1
        print(f"Created {stone_type}: id={created['id']}; photos={len(images)}", flush=True)
    print(f"Completed: {len(fixtures)} stones, {total_photos} photographs", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
