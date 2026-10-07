# Populate Stones Through the HTTP API

Run this command explicitly against the desired running backend. It creates real
records; application startup and normal tests do not run it automatically.
Python 3 is sufficient; no additional Python package is required.

```sh
python3 scripts/populate_stones.py --base-url http://localhost:8080
```

The default input is this feature's stone_test_img directory. Only numbered tiles
inside the type folders are uploaded, not the root composite images. The supplied
dataset creates 10 AVAILABLE stones with 124 photographs; Limestone has 16 and
the other nine types have 12 each. Sizes cycle through SMALL, MEDIUM, and LARGE.

To use another set of type folders:

```sh
python3 scripts/populate_stones.py --base-url http://localhost:8080 --image-root /path/to/type-folders
```

Each folder name must identify a supported stone type. Each folder contains 1 to
16 nonempty, numerically named PNG/JPEG/WebP images of at most 10 MiB each.
All local inputs are checked before the first mutation request. Backend image
validation still checks the actual image bytes and media types.

The script posts one image at a time to POST /api/v1/stone-photo-drafts, then posts
the generated JSON details and ordered photoUploadIds to POST /api/v1/stones.
It reports the target, created IDs, and final counts. It does not access PostgreSQL
or MinIO directly and does not retry failed calls automatically.

If stone creation fails, stderr contains a JSON report with stage, error,
uploadedPhotoIds, and stoneRequest. Correct the details and send that stoneRequest
to the same creation endpoint before the draft IDs expire; no image bytes need
to be uploaded again. Drafts expire 24 hours after their original successful
uploads. An upload-stage failure may report only a partial photo list; finish the
remaining uploads before submitting the intended complete gallery.

Each successful invocation creates another dataset. The loader does not deduplicate
names. If a response is lost after a successful creation, consumed draft IDs are
not reusable; inspect the target catalog before creating another set of uploads.

The backend needs PHOTO_STORAGE_ENABLED, MINIO_ENDPOINT, MINIO_BROWSER_ENDPOINT,
MINIO_BUCKET, MINIO_DRAFT_BUCKET, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY configured.
The two bucket names must differ. Set STONE_PHOTO_PLACEHOLDER_URL to the
browser-reachable backend /images/placeholder-rock.png URL when frontend and
backend origins differ. See the repository .env.example for local examples.

Loader behavior tests use a temporary local HTTP server:

```sh
python3 -m unittest discover -s scripts -p 'test_populate_stones.py'
```

The backend integration suite also exercises the default loader against an
isolated Testcontainers-backed HTTP server and cleans up its records and objects.
