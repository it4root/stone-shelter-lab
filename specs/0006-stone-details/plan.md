# Implementation Plan: Feature 0006

## Scope and Sequence

Implement all authorized tasks T0006-001 through T0006-008 without stopping
between tasks. No commits or pushes are authorized. Acceptance lives exclusively
in [acceptance.md](acceptance.md). Preserve unrelated engineering notes.
Frontend remains mock-first; implement real backend photo storage independently.
Volunteer upload UI, adoption, favorites, chatbot and live frontend API integration
remain excluded. Use the existing placeholder-rock.png for every mock gallery image.

## Storage and Contract Decisions

- Use MinIO server RELEASE.2025-04-22T22-12-26Z and Java SDK
  io.minio:minio:8.5.17, both verified official released tags. SDK is required for
  S3 object upload, removal and signing; no existing dependency provides them.
  Record these concrete pins in ADR-0001; retain all existing stack versions.
- The official prebuilt Docker Hub image returns 404 and Quay rejects anonymous
  access during verification. Build the local stone-shelter-minio image from the
  same official GitHub release binary on alpine:3.22.6. Verify the release's
  published SHA-256 for amd64/arm64 before installation; fail unsupported targets.
  Compose and Testcontainers use the same Dockerfile, preserving the server pin
  without relying on an opaque third-party mirror or unavailable registry image.
- Private bucket; backend generates presigned GET URLs lasting one hour. Separate
  internal MinIO endpoint from browser-reachable signing endpoint, all configured
  by environment. Persist object keys, never presigned URLs. No frontend credentials.
- Add com.twelvemonkeys.imageio:imageio-webp:3.12.0 so Java ImageIO can
  decode WebP and reject corrupt compressed payloads; signatures/chunk headers
  alone cannot verify image data. The JDK already decodes JPEG/PNG. This is a
  justified upload-validation dependency, not an image editing feature.
- Accept one JPEG, PNG or WebP image per multipart file upload, up to 10 MiB.
  Check actual file signature and declared media type. Missing/empty/corrupt input
  is 400; unsupported or mismatched media type is 415; oversized file is 413.
  Set multipart request allowance above file limit for envelope overhead.
  Allow Tomcat to drain rejected multipart input so oversized requests receive
  the documented ProblemDetail rather than a prematurely closed connection.
- Add metadata table with stone foreign key, object key, addedAt and zero-based
  position; enforce unique (stone_id, position). Existing legacy photo strings
  remain unchanged in storage. Read photo projects first managed image when any
  exists, otherwise the legacy value. photos is always an ordered array.
- Upload bytes with server-generated unique keys. Serialize position assignment
  with a repository-owned per-stone lock; services never use JPA query APIs.
  DTO/entity transformation remains in mappers and errors in custom exceptions.
- A database transaction cannot roll back object storage. Persist cleanup intent
  for a new object before upload; remove that intent when metadata commits.
  Keep upload orchestration outside a database transaction: validate input and
  resource existence, persist intent independently, then delegate to a separate
  transactional attachment service which rechecks and locks the stone and intent.
  This prevents concurrent requests exhausting the connection pool through nested
  transactions. Attempt compensation only after attachment rollback has completed.
  Attempt immediate compensation on failure and retain durable retry if removal
  fails. Queue managed keys transactionally on stone deletion, remove metadata,
  then clean objects after commit with durable retry. Cleanup work must never
  delete a successfully attached object; use delayed safety/retry processing for
  incomplete uploads. This queue implements the required failure compensation,
  not a general event/messaging subsystem.
  Post-commit cleanup failures are logged and retried from the durable queue;
  they must not change the successful response for an already committed deletion.
- Existing stone deletion returns its identifier-only 200 response; external
  legacy URLs are never deleted. Storage unavailable on upload returns 503.
- Extend generated OpenAPI from actual multipart controllers/shared DTOs. No
  handwritten contract. Return dedicated upload DTO {id,url,addedAt,position}.

## Frontend Architecture and Navigation

Use existing React and browser History API for the two documented routes; add
no routing, carousel or state library. Keep a small application navigation boundary
under App. Real links preserve modified-click/new-tab browser behavior; handle
ordinary internal clicks with pushState and listen to popstate. Direct visits and
refresh resolve the requested id; unknown/malformed detail routes show not-found.

Keep feature-owned catalog state above page switching for the current app session,
including applied filters, drafts/errors, sort, page/size and sidebar state.
Do not create a global store. Restore the catalog scroll position after render;
details starts at top. Back to catalog targets / and has a direct-entry fallback.
Shared header/footer retain behavior. Detail feature components/hook live under
features/stone-details; reusable stone gallery can live in domain/stone/components.
Each component has a matching PascalCase folder with colocated CSS/tests.

Add separate StoneResponse and photo DTOs under api/dto and detail mock lookup
behind api/stonesApi. Reuse the same 30 identities. Provide galleries of 0, 1 and
6 images to exercise overflow; every mock image is the supplied placeholder.
Photos have distinct metadata/ids despite identical image assets. Search covers
and detail defaults agree. Do not duplicate fixtures in components.

## Presentation

Desktop has image/gallery left and supported information right. Stack on narrow
screens; preserve global tokens and full biography. Gallery selection is local
and resets for each new detail visit. Thumbnail buttons expose selection and
focus; finite Previous/Next controls scroll the strip. Use CSS overflow/scroll
snapping, touch scrolling and ResizeObserver to derive overflow boundaries.
No autoplay, lightbox, reorder, delete or persisted main-photo setting.
Image errors use placeholder once without retry loops. Stable aspect ratio avoids
layout shifts; zero/one-photo states omit unnecessary carousel navigation.

## Verification

Verify infrastructure rendering and new schema/dependency compile. Backend tests
use real PostgreSQL and MinIO Testcontainers plus controlled failure tests;
check signature/size/errors, concurrent append order, search cover, legacy values,
cleanup, JSON/YAML generated schema, mappers and architecture boundaries.
Run full Maven verify on JDK 23.0.2. Frontend tests cover routes/history/state,
selected-image behavior and missing/broken/zero/single galleries; run lint/test/build.
Inspect Chrome at 1440/1024/768/390/320 pixels, keyboard interactions, direct
refresh and state/scroll restoration. Record evidence and leave local UI running.

## Primary References

- [MinIO server release](https://github.com/minio/minio/releases/tag/RELEASE.2025-04-22T22-12-26Z)
- [MinIO Java SDK release](https://github.com/minio/minio-java/releases/tag/8.5.17)
- [Accepted UI architecture](../../docs/adr/0005-ui-mock-to-code.md)

- [TwelveMonkeys ImageIO release](https://github.com/haraldk/TwelveMonkeys/releases/tag/twelvemonkeys-3.12.0)
