# Add Stone API — Technical Plan

Specification: [spec.md](spec.md). Acceptance criteria:
[acceptance.md](acceptance.md). Tasks: [tasks.md](tasks.md).

## Storage and Persistence

Retain the existing numeric stone ID and permanent bucket configuration. Add
MINIO_DRAFT_BUCKET and require two different bucket names when photo storage is
enabled. New stone entities generate a storage UUID; a new Liquibase migration
backfills existing stones without moving their photos.

Draft photo records store UUID, object key, upload time, expiry, and an optional
associated stone. Managed photos store their permanent target key, optional draft
source reference, and a copy-ready flag. Existing photos default to ready.
Cleanup identifies work by the composite bucket-kind/object-key pair, preserving
existing permanent-only service entry points for the append-photo workflow.
All schema changes use a new 0008 changeset.

## Transactions and Locking

Draft upload validates first, records durable draft cleanup intent in an
independent transaction, writes MinIO bytes, and commits draft metadata. Only then
does it return an upload DTO. Use a UTC Clock bean to test expiry boundaries.

StoneService orchestrates creation without an outer transaction. A transactional
StoneCreationService locks draft records in UUID order, validates all references,
creates the stone and managed photo entities through mappers, and associates the
drafts in one PostgreSQL transaction. Return the committed numeric ID to the
orchestrator. Expiry is checked after acquiring locks. Concurrent duplicate
consumption becomes an application conflict, translated by the HTTP handler.

The orchestrator then attempts each permanent copy once. A separate transactional
copy service locks the stone, then its draft source and cleanup intent, registers
permanent orphan cleanup before copying, and records successful readiness. Copy
or readiness failures roll back only that copy's metadata transaction and retain
the source; other copies are still attempted. Return the create DTO in a read
transaction after the attempts. Do not introduce event brokers, replication
workers, repair queues, retries, or new stone business states.

Cleanup locks the draft record before its cleanup work. Creation does not lock
cleanup rows, so association and expiration cannot invert those locks. Stone
deletion and copying both lock the stone before source records. Cleanup protects
associated sources until their managed photo is ready. After a confirmed copy,
enqueue the draft source for deletion; retain its consumed-reference metadata
until stone deletion so reuse still returns a conflict after source cleanup.
Protect permanent objects referenced by ready photos. Queue work for both buckets on stone deletion and remove draft
metadata explicitly before deleting the stone. Preserve failed work across
restart. Extend the existing bounded job to process both queues within one
shared object/time/rate budget and one readiness check.

## HTTP and Mapping

Add a StonePhotoDraftController with the two documented routes. Shared upload
and preview DTOs expose UUID and timestamps. Controllers bind/validate and pass
the original Request DTO; services reuse image validation and invoke entity/DTO
mappers. Keep exception types independent of HTTP.

Extend StoneCreateRequest with at most 16 non-null UUID references. Reject
duplicates in the application service. Extend StoneCreateResponse with photos;
reuse the managed photo DTO mapper for creation/details/catalog projections.
For T0008-009 remove admissionDate from the creation request and request mapper.
Use the creation service's existing injected UTC Clock to assign admissionDate
to the mapped entity before saving, including photo-free requests. Ignore the
obsolete JSON property explicitly; document the server-owned response timestamp
in generated OpenAPI. Preserve update validation and existing historical dates.
Pending copies map to the backend's /images/placeholder-rock.png static asset,
copied from the existing supplied placeholder. Permanent keys remain unchanged
for older images. Draft timestamps use whole seconds to match S3 signing precision. Preview URLs
use the smaller of one hour and remaining draft lifetime; check the signed URL
deadline as well to reject a preview if signing crosses expiration. Metadata
refresh never changes expiry.

OpenAPI is generated from the controllers and shared DTO annotations only.
No new dependency or version change is needed. Keep all packaging, DTO shape,
mapper naming/null policies, and layer boundaries from AGENTS.md.

## Operator Loader

Use Python 3 standard-library HTTP/multipart support in an explicitly invoked
script. Require --base-url and allow a fixture root argument. Validate all type
folders/counts/numeric filenames before mutations. Upload each numbered tile,
then create one AVAILABLE stone per type with supported sizes, omitting the
server-owned admission timestamp. Print created IDs and, on failure, the reusable upload IDs and stone
JSON. Do not run against a real database during implementation or verification.

## Verification

Use the pinned JDK 23.0.2 and ./mvnw verify. Existing PostgreSQL Testcontainers
and the pinned MinIO test image cover migration, bytes, URLs, concurrent claims,
cleanup, regression, and generated JSON/YAML contracts. Use injected Clock and
controlled repository/storage failures rather than sleeps. Each test owns and
cleans its data. Verify loader failures using an isolated HTTP server and run the
full supplied loader against an isolated test backend. Retain existing assertions
when adapting tests to intentionally extended response schemas.
