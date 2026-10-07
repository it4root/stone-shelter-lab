# Add Stone API with Draft Photos

## Goal

Support a future single stone creation form where a user uploads photographs,
previews them, fills in stone details, and creates a stone without uploading the
same files again after a failed creation request. Provide an operator-run way to
populate a real database through the same HTTP API, without implementing a UI.

Acceptance criteria live exclusively in [acceptance.md](acceptance.md).
Implementation work is listed in [tasks.md](tasks.md). Technical decisions must
be recorded in [plan.md](plan.md) before implementation.

## Current Scope and Authorization

Implementation of all tasks has been explicitly requested after preparation of
this specification. Running the loader against a real database, creating commits,
and pushing remain unauthorized.

The existing catalog creation route already accepts stone details as JSON.
Existing managed photo uploads require an existing stone. This feature adds
photo uploads before a stone exists and extends creation to accept references to
those uploads. Existing catalog, reservation, and post-creation photo operations
remain supported.

## User Flow

1. Upload each selected photograph to the draft photo API.
2. Use the returned photo identifiers and temporary read URLs to assemble a
   preliminary gallery. The future page is assumed to exist but is outside scope.
3. Submit the stone details and an ordered list of up to 16 uploaded photo IDs.
4. Persist the stone and all photo associations in PostgreSQL.
5. Attempt to copy the associated draft objects into permanent storage.
6. Return successful creation once the stone and its associations are committed,
   regardless of the result of the internal copying operation.

A failed stone creation request leaves previously successful draft uploads
available until their original expiration. Correcting details and submitting
again sends JSON and upload IDs, not file bytes.

## Creation Success Boundary

Creation succeeds when the stone is committed in PostgreSQL and every referenced
photo was successfully stored in the draft bucket and is associated with that
stone. All references must be accepted together; a rejected request must not
create a stone or consume a subset of its photo references.

Copying failure is an internal storage issue. It must not roll back a committed
stone, turn successful creation into a client error, require the user to upload
again, or change the stone's adoption status. Affected gallery entries use a
temporary placeholder image. Replication, repair workers, repeated copy attempts,
support alerts, and support workflows are outside scope.

## Photo Storage and Lifecycle

- Use two distinct private MinIO buckets: an external/draft bucket for incoming
  uploads and an internal/permanent bucket for accepted application data.
- Bucket names, endpoints, and credentials come from environment configuration.
  Reuse the existing permanent bucket setting and add a draft bucket setting.
- Draft objects use backend-generated unique keys under a `draft/` prefix.
  Client filenames never determine bucket names or object paths.
- Every newly created stone receives a stable, unique storage UUID. Its existing
  numeric HTTP/database ID remains unchanged. Permanent objects are copied to
  `{stoneUuid}/{photoUuid}` within the internal bucket; no empty-folder object is
  required for a stone without photographs.
- Persist object keys, bucket identity, associations, and copy readiness rather
  than presigned URLs. Copy readiness is technical photo metadata, not a new
  business status for the stone.
- An unassociated photo expires exactly 24 hours after its successful draft
  upload. Reads and creation reject it at or after `expiresAt`, even if its bytes
  have not yet been physically removed.
- Expired unassociated bytes and metadata become eligible for bounded scheduled
  cleanup. Physical deletion occurs on a successful cleanup run and can be
  delayed by scheduling or unavailable storage; expiration is not extended.
- A creation failure does not reset a photo's expiration time.
- Once associated with a committed stone, a draft source is exempt from the
  unassociated-photo expiration rule. Retain it if permanent copying failed.
- Once a permanent copy and its database readiness are confirmed, enqueue the
  redundant draft source for cleanup. Do not remove it before that confirmation.
- Cleanup and association must coordinate so cleanup cannot delete a source
  accepted by a concurrent creation transaction.
- Deleting a stone must also account for its retained draft sources and permanent
  objects using durable cleanup work. Preserve the existing deferred cleanup of
  older managed photographs.
- Cleanup must distinguish bucket and key; equal keys in different buckets must
  not cause deletion of the wrong object. Reuse the existing bounded cleanup
  approach and stop a run on dependency failure rather than retry every object.

## HTTP Contract Requirements

Generated `/v3/api-docs` and `/v3/api-docs.yaml` are the HTTP contract source of
truth. Generate schemas from Spring MVC controllers and shared DTOs. This
specification states required behavior; do not create a handwritten OpenAPI file.
All error responses use RFC 9457 `application/problem+json`.

### Upload a Draft Photograph

`POST /api/v1/stone-photo-drafts`

Accept one `multipart/form-data` image in part `file`. Do not require a stone ID
or create a stone as a side effect. Use a dedicated draft upload Request DTO and
Response DTO. Return HTTP 201 without a `Location` header after bytes and durable
metadata have been stored successfully. The response contains:

| Field | Meaning |
| --- | --- |
| id | Backend-generated UUID used to reference this draft upload |
| url | Browser-usable private draft image read URL |
| uploadedAt | Server-assigned successful upload timestamp |
| expiresAt | uploadedAt plus 24 hours while unassociated |

Keep the current JPEG, PNG, and WebP validation and 10 MiB per-file limit.
Reject missing, empty, or corrupt files with 400; oversized files with 413;
unsupported or mismatched media types with 415; unavailable draft storage with
503. A failed upload must not leave a usable draft reference. Interrupted storage
or metadata operations must leave durable cleanup work for any orphaned object.

### Refresh a Draft Preview

`GET /api/v1/stone-photo-drafts/{id}`

Return HTTP 200 with a dedicated Response DTO exposing `id`, `url`, `uploadedAt`,
and `expiresAt` for an unassociated, unexpired upload. This allows preview URLs
to be refreshed without uploading bytes again. A malformed UUID returns 400;
unknown, expired, or already-associated IDs return 404. Draft storage
unavailability returns 503. Read URLs last at most one hour and never outlive
the upload's remaining unassociated lifetime. Refreshing a URL does not renew
the 24-hour lifetime.

### Create a Stone with Previously Uploaded Photos

Extend `POST /api/v1/stones`, retaining `application/json` and the following
`StoneCreateRequest` fields and validation:

| Field | Requirement |
| --- | --- |
| name | Required, nonblank, at most 120 characters |
| stoneType | Required existing StoneType enum value |
| stoneSize | Required SMALL, MEDIUM, or LARGE |
| adoptionStatus | Required AVAILABLE, RESERVED, or ADOPTED; no default |
| biography | Optional, at most 2048 characters |
| photo | Existing optional legacy string, at most 500 characters, preserved |
| photoUploadIds | Optional ordered array of distinct draft UUIDs, at most 16 |

Admission date is server-owned during creation. It is not a property of
StoneCreateRequest and is not required from callers. The creation service sets
the existing admissionDate to the current UTC instant using the injected Clock
when creating the stone, before persistence. A legacy admissionDate property in
JSON is ignored and cannot override the server timestamp. Creation, detail and
search responses retain admissionDate as a UTC date-time.

This revision does not change the existing full-replacement update contract,
historical stored dates, search date filters or sorting. No database default,
new column or migration is required. The operator loader omits admissionDate
and receives the server-assigned timestamp like other creation clients.

Omitted, null, or empty `photoUploadIds` creates a stone without a managed gallery
and preserves the existing legacy creation behavior. No new minimum photo count
is introduced. The limit of 16 applies to the initial gallery submitted in this
creation request. The existing append-photo endpoint is not redesigned here.

Each referenced upload must have successfully stored bytes, still be within its
24-hour lifetime at association, and not already belong to another stone.
Validate and associate the complete list atomically. Array order defines
zero-based gallery positions; the first entry is the cover. UUID validation,
null entries, duplicate IDs, and more than 16 entries return 400. Unknown or
expired references return 400. Already-associated references return 409;
concurrent attempts must not attach one draft upload to two stones.

Return HTTP 201 without `Location` using `StoneCreateResponse`. Preserve the
existing fields and add an ordered, non-null `photos` array using the existing
photo entry shape (`id`, `url`, `addedAt`, `position`). Photo IDs in that array
are managed gallery IDs; they need not equal the draft UUIDs. With managed
photos, the response `photo` is the first gallery entry's URL. With no managed
photos, it preserves the supplied legacy value. Database failures return 500
without consuming drafts or creating a partially persisted stone.

Permanent copying starts only after successful database creation. Attempt it
once as part of this backend operation; do not require a background replication
service. Failure of one copy does not prevent attempting the other associated
photos. The final successful response reflects the resulting gallery, including
placeholders where permanent copies are not ready. Response mapping and reading
must not fail solely because such a copy is unavailable.

### Read Created Stones and Images

Preserve `GET /api/v1/stones/{id}` and `POST /api/v1/stones/search`. Details expose
the complete ordered gallery; catalog `photo` and details `photo` both project
the first managed gallery entry. A photo whose permanent copy is unavailable
retains its gallery ID and position and exposes a browser-usable placeholder
URL, never a missing permanent-object URL or a draft-source URL. Successfully
copied photos expose permanent bucket presigned read URLs lasting one hour.

The backend must serve the existing placeholder image through a documented
static image URL so a future UI can display it without new UI implementation.
Use the existing supplied placeholder asset; do not generate a new image.

Existing legacy stones and managed gallery objects remain readable. Introducing
the second bucket must not reinterpret or relocate existing permanent objects.

## Populate a Real Database Through the API

Usage instructions are in [data-loader.md](data-loader.md).

Provide an explicitly invoked command-line loader targeting a caller-supplied
backend base URL. It must upload images with the draft endpoint and create stones
with `POST /api/v1/stones`; it must not use direct SQL, repositories, database
credentials, Liquibase seed inserts, or direct MinIO writes.

Use the supplied per-type subfolders in `stone_test_img/`, not the root composite
images. The default dataset is one stone for each of the ten type folders. Use
numeric image filename order for the gallery. The current fixture set contains
12 images for each type except Limestone, which contains 16: 10 stones and
124 photographs in total.

Generate valid English names/biographies, supported sizes, AVAILABLE adoption
status, and valid past or present admission timestamps. Report created stone
IDs and failures. On creation failure, report the successful draft IDs so an
operator can repeat creation within their remaining lifetime without uploading
the same photographs again. Stop and report failed API calls rather than
silently skipping files or issuing unbounded retries.

Validate the local folder/type/count structure before issuing mutation requests.
Require an explicit target URL; do not seed automatically on startup or during
ordinary verification. Multiple successful invocations may create another set
of stones; name-based deduplication is not required by this feature.

## Implementation Constraints

Follow the constitution and root/backend AGENTS.md. Add new Liquibase migrations
for draft metadata, storage UUIDs, copy readiness, and bucket-aware cleanup;
never edit applied changesets. Preserve repository/controller/service/mapper
responsibilities and existing pinned versions. Reuse existing dependencies.
DTOs with more than four fields must be classes. Technical state and persistence
entities must not escape into controllers or response contracts.

## Out of Scope

- Creation-form UI and preliminary-gallery UI implementation.
- Stone draft/publication business statuses and application/approval workflows.
- Authentication, user accounts, roles, and upload ownership policy.
- Automatic replication, repair jobs, support alerts, or support integration.
- Photo deletion, reordering, or cover-selection endpoints.
- Direct browser-to-MinIO uploads and client-side image processing.
- Automatic database population and execution of the real-data loader now.
- Request-wide idempotency keys or name-based duplicate detection. Already-used
  photo references still cannot be consumed twice.
