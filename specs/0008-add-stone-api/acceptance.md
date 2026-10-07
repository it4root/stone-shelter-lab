# Add Stone API — Acceptance Criteria

Criteria are defined only in this file. IDs are stable. Implementation and
verification are complete; the evidence below records the actual test results.

## Draft Uploads and Preview

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| AC-0008-001 | No stone exists for a new photo | A valid image is posted to `/api/v1/stone-photo-drafts` as multipart `file` | HTTP 201 without Location; a UUID, preview URL, uploadedAt, and expiresAt are returned; the exact bytes exist in the draft bucket; no stone is created | PostgreSQL and MinIO integration |
| AC-0008-002 | Valid JPEG, PNG, and WebP fixtures | Each supported format is uploaded, including a valid image at the 10 MiB limit | Each succeeds and the preview URL returns the submitted image bytes | Storage integration |
| AC-0008-003 | Missing, empty, or corrupt file data | A draft upload is attempted | HTTP 400 ProblemDetail; no usable draft upload is recorded | HTTP integration |
| AC-0008-004 | A file larger than 10 MiB | It is uploaded | HTTP 413 ProblemDetail; no usable draft upload is recorded | HTTP integration |
| AC-0008-005 | An unsupported format or a declared media type that mismatches the bytes | It is uploaded | HTTP 415 ProblemDetail; no usable draft upload is recorded | HTTP integration |
| AC-0008-006 | Draft storage is unavailable, or metadata persistence fails after object upload | An upload is attempted | No successful draft reference is returned; storage failure returns 503 and persistence failure returns 500 ProblemDetail; any orphaned bytes have durable cleanup work | Controlled failure integration |
| AC-0008-007 | An unassociated photo successfully uploaded at time T | Its metadata is examined | expiresAt is T plus 24 hours; returned URLs do not outlive one hour or remaining draft lifetime | Time-controlled integration |
| AC-0008-008 | An unexpired, unassociated draft upload | GET `/api/v1/stone-photo-drafts/{id}` is called | HTTP 200 with a usable refreshed preview URL and unchanged upload identity, uploadedAt, and expiresAt; no new object is uploaded | HTTP and storage integration |
| AC-0008-009 | Malformed, unknown, expired, and associated draft IDs | Each is read through the draft preview endpoint | Malformed UUID returns 400; unknown, expired, and associated IDs return 404 ProblemDetail; an expired ID is rejected even before physical cleanup | Time-controlled HTTP integration |
| AC-0008-010 | An unexpired draft whose bucket is unavailable | Its preview is requested | HTTP 503 ProblemDetail; draft metadata and original expiration are retained | Controlled failure integration |

## Creation and Reference Validation

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| AC-0008-011 | Valid stone details and 1 or 16 distinct, unexpired draft uploads | POST `/api/v1/stones` sends their ordered photoUploadIds | HTTP 201 without Location; one stone and all gallery associations are committed; the response contains a stable stone ID and the complete ordered photos array | PostgreSQL and MinIO integration |
| AC-0008-012 | Valid legacy creation requests with omitted, null, or empty photoUploadIds | Each is posted | HTTP 201; photos is an empty array; supplied legacy photo values remain unchanged; no draft upload is required | Catalog regression integration |
| AC-0008-013 | Previously uploaded drafts and invalid stone details | Creation is rejected, then corrected details are posted before expiry using the same IDs | First call returns 400 without creating or consuming anything; corrected call succeeds without another file upload; draft expiration was not renewed | HTTP and persistence integration |
| AC-0008-014 | An array containing 17 IDs, duplicate IDs, null entries, or malformed UUIDs | Creation is attempted | HTTP 400 ProblemDetail; no stone or photo association is created | HTTP integration |
| AC-0008-015 | A list containing an unknown or expired draft along with valid drafts | Creation is attempted | HTTP 400 ProblemDetail; no partial stone is created and valid drafts remain reusable until their original expiry | Time-controlled persistence integration |
| AC-0008-016 | A draft already associated with a committed stone | Another creation request references it | HTTP 409 ProblemDetail; no second stone is created from that request and the first association remains intact | Persistence integration |
| AC-0008-017 | Two concurrent requests referencing at least one common draft | Both attempt creation | At most one commits; the other receives 409; no draft belongs to two stones and the losing request creates no partial stone | Concurrent PostgreSQL integration |
| AC-0008-018 | Valid drafts and a database failure during creation | Creation is attempted | HTTP 500 ProblemDetail; no partial stone or consumed references remain; the same drafts can be used after recovery before expiry | Controlled failure integration |
| AC-0008-019 | Existing stone validation rules | Missing required fields, invalid enums, oversized strings or blank names are submitted | Existing 400 ProblemDetail behavior remains; names may still be duplicated; adoptionStatus has no default; creation admissionDate is server-owned, while full-replacement update timestamp validation remains | Catalog regression integration |

## Permanent Copying and Gallery Projection

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| AC-0008-020 | Valid drafts and healthy permanent storage | A stone is successfully created | Actual copies exist in the distinct permanent bucket under one stable stone UUID prefix with unique photo keys; bytes match; existing numeric stone IDs are preserved | PostgreSQL and MinIO integration |
| AC-0008-021 | A creation transaction that fails before commit | It references draft photos | Permanent copying does not start; original draft objects remain available within their lifetime | Controlled failure integration |
| AC-0008-022 | Successfully stored drafts and a committed stone | All permanent copy attempts fail | Creation still returns 201; the stone and all photo associations remain; no adoption status change or client reupload is required | Controlled failure integration |
| AC-0008-023 | Several associated photos and one failed copy | The remaining copies are attempted and the stone is read | Available copies use permanent read URLs; affected entries use the placeholder; IDs, positions, and total gallery count are preserved | Controlled failure integration |
| AC-0008-024 | A created stone with ordered photos | Creation response, details GET, and catalog search are compared | Initial request order defines positions starting at 0; the first entry is the cover in all projections; permanent URLs last one hour; pending/failed copies expose no draft or missing permanent URL | HTTP integration |
| AC-0008-025 | A gallery entry whose permanent copy is unavailable | Its placeholder URL is requested | The backend returns the existing placeholder as an image; no new frontend implementation is required | HTTP integration |
| AC-0008-026 | Existing legacy stones and older managed photographs | Catalog/details and the existing append-photo route are exercised after migration | Existing objects remain accessible in their original permanent bucket; legacy fallback and existing route behavior remain supported | Regression integration |

## Expiration and Cleanup

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| AC-0008-027 | An unassociated upload at time T | Creation is attempted just before and at T plus 24 hours | The reference is usable before expiry and rejected at expiry; neither URL refresh nor failed creation extends it | Time-controlled integration |
| AC-0008-028 | Expired unassociated uploads and healthy storage | Scheduled cleanup is invoked | Expired bytes and unused metadata are removed; unexpired uploads are retained | PostgreSQL and MinIO integration |
| AC-0008-029 | A committed stone whose copy failed and whose draft source is older than 24 hours | Unassociated-draft cleanup runs | The associated draft source and gallery metadata are retained | Storage integration |
| AC-0008-030 | A confirmed permanent copy with recorded readiness | Redundant-draft cleanup runs | The draft source is removed; the permanent image and gallery association remain usable | Storage integration |
| AC-0008-031 | A draft eligible for cleanup and concurrent creation using that draft | Cleanup and association compete | An expired reference cannot be accepted, and a source accepted before expiry cannot be deleted as unassociated; no committed association points to a source deleted by that race | Concurrent PostgreSQL and MinIO integration |
| AC-0008-032 | Durable cleanup work for objects in both buckets, including equal keys in different buckets | Cleanup runs and later encounters a storage failure | Only the intended bucket/key is removed; the run stops on failure and retains unfinished work across restart | Controlled failure integration |
| AC-0008-033 | A stone with permanent copies and retained draft sources | The stone is deleted and cleanup subsequently succeeds | Stone/gallery metadata are removed using the existing deletion contract; owned objects in both buckets are eventually removed | Storage regression integration |

## HTTP Contract and Test Data Loader

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| AC-0008-034 | The backend is running | Generated `/v3/api-docs` and `/v3/api-docs.yaml` are inspected | Draft upload/preview routes, dedicated DTOs, multipart file input, UUID/time fields, creation photoUploadIds limit, photos responses, and documented statuses are represented consistently; no handwritten OpenAPI is added | Generated-contract integration |
| AC-0008-035 | The current fixture folders and an explicitly selected running API | The operator invokes the default data loader | It creates 10 stones and 124 photo uploads through the draft and creation HTTP routes; Limestone has 16 photos and every other type has 12; folder names map to supported stone types | Loader end-to-end verification against test infrastructure |
| AC-0008-036 | Numeric tile files and root composite images | Loader input selection is inspected through recorded HTTP calls | Only per-type numbered tiles are uploaded, in numeric order; valid English stone details and caller-supplied target URL are used; no SQL or direct MinIO writes occur | Loader behavior verification |
| AC-0008-037 | An invalid local type folder or a folder with more than 16 images, or no explicit target URL | The loader is invoked | It reports the input error before mutation requests; it does not silently skip unsupported input | Loader behavior verification |
| AC-0008-038 | Successful draft uploads followed by a failed creation API call | The loader handles the failure | It stops, reports the error and reusable draft IDs, and does not resend file bytes or claim successful creation | Loader behavior verification |
| AC-0008-039 | Normal application startup and ordinary backend verification | They run without explicit loader invocation | No real-database seed population occurs | Startup/loader invocation verification |
| AC-0008-040 | Valid stone details with zero or uploaded photos and a controlled server clock | Creation omits admissionDate or includes an obsolete client value | HTTP 201 persists the current server UTC instant as admissionDate; create/detail/search agree, the client value cannot override it, generated create schemas omit the property, and loader requests send no date | Controlled-clock HTTP/persistence, generated-contract and loader checks |

## Verification Rules

Use PostgreSQL Testcontainers for database tests and real MinIO test infrastructure
for object behavior. Use controlled failures for unavailable storage, failed
copies, and database errors. Control timestamps without waiting 24 hours.
Create and clean up each test's own records and objects. Record results here or
in task completion evidence only after implementation and actual verification.

## Verification Evidence — 2026-10-07

All 39 criteria passed review and verification. The final backend command, run
from stone-shelter-api with PostgreSQL 18.6 and the pinned MinIO Testcontainers
image, was:

```sh
JAVA_HOME=/usr/local/Cellar/openjdk/23.0.2/libexec/openjdk.jdk/Contents/Home ./mvnw -q verify
```

Result: 208 tests, zero failures, zero errors, zero skipped tests. The suite
includes 26 draft/lifecycle/loader integration cases, one existing-schema upgrade
case, 13 existing managed-photo cases, nine cleanup job cases, seven generated
OpenAPI cases, 98 catalog cases, 24 reservation cases, eight mapper cases,
21 architecture cases, and one bootstrap case.

| Criteria | Passing evidence |
| --- | --- |
| AC-0008-001–AC-0008-010 | StonePhotoDraftIntegrationTest: exact image bytes/formats/limit, ProblemDetail failures, durable orphan work, preview refresh and exact expiry, including the last fraction of a second |
| AC-0008-011–AC-0008-018 | StonePhotoDraftIntegrationTest: complete ordered creation, legacy requests, correction without reupload, rejected lists, association rollback and concurrent claims; consumed IDs remain conflicts after source cleanup |
| AC-0008-019 | StoneCatalogControllerTest: original field validation and legacy creation regressions |
| AC-0008-020–AC-0008-025 | StonePhotoDraftIntegrationTest: committed rows visible before real copies, permanent target UUID/bytes, full/partial/internal lookup/readiness failures, placeholder asset and creation/detail/catalog projections |
| AC-0008-026 | StonePhotoDraftMigrationTest upgrades the actual first three changesets with existing rows, then applies 0008; old IDs/keys/URLs, ready photos and permanent cleanup identity remain; StonePhotoIntegrationTest and catalog regressions pass |
| AC-0008-027–AC-0008-033 | StonePhotoDraftIntegrationTest and PhotoCleanupJobServiceTest: logical expiry, physical cleanup, retained failed-copy sources, redundant source removal, concurrent association, bucket isolation, failure retention, shared bounds and stone deletion |
| AC-0008-034 | OpenApiDocumentationTest: routes/DTOs/statuses/UUIDs/multipart/maxItems/gallery and whole-document generated JSON/YAML equality |
| AC-0008-035 | Default CLI invoked through a real isolated backend: 10 stones, 124 photographs; all permanent bytes checked against the corresponding numbered tiles |
| AC-0008-036–AC-0008-038 | Four Python tests: recorded HTTP ordering, composites excluded, invalid inputs rejected before mutations, explicit target required and reusable IDs reported without retransmission |
| AC-0008-039 | Loader has an explicit CLI entry point; application bootstrap contains no loader or seeding hook; end-to-end population targets test infrastructure only |

Standalone loader verification, run from the repository root:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts -p 'test_populate_stones.py'
```

Result: four tests passed. git diff --check also passed. New/modified backend
sources are under the module source roots and included in the verified build.
Applied migrations, dependencies/versions and UI sources were unchanged. No
commits or pushes were created, and no real database was populated.

The documented scope limits still apply: logical draft expiry is immediate,
physical deletion follows successful bounded scheduled cleanup, and failed-copy
sources stay associated indefinitely without automated repair or replication.
These are intentional scope boundaries, not outstanding implementation tasks.

## Server-Owned Creation Date Verification — T0008-009, 2026-10-08

The revised creation requirements were documented before implementation.
AC-0008-040 passes controlled-clock checks: photo-free and 16-photo creation
persist the server instant, and create/detail/search responses agree. Obsolete
past, future and malformed client date values cannot override it. Generated
creation schemas omit admissionDate and response schemas retain date-time;
the existing update validation and historical date/filter/order behavior remain.
The loader's recorded HTTP request contains no date.

On JDK 23.0.2, ./mvnw -q verify passed with 205 tests, zero failures, errors
or skips. A concurrent targeted run subsequently replaced the catalog report;
the full 95-case catalog suite was rerun successfully to retain complete
evidence. Seven generated-contract cases pass, including whole-document
JSON/YAML equivalence. Current generated documents were captured from isolated
test infrastructure and compared with frontend DTOs. Four standalone Python
loader tests and git diff --check passed.

The lower backend test count reflects removal of obsolete creation-date
validation cases and addition of server-clock checks; update-date cases remain.
No dependency, migration, real database population, commit or push was added.
