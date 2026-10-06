# ADR-0006: Stone Details, Ordered Gallery and MinIO Storage

- Date: 2026-10-06
- Status: Accepted within the authorized feature implementation
- Feature: [0006-stone-details](../../specs/0006-stone-details/spec.md)
- Plan: [plan.md](../../specs/0006-stone-details/plan.md)
- Acceptance: [acceptance.md](../../specs/0006-stone-details/acceptance.md)
- Extends: [ADR-0005](0005-ui-mock-to-code.md)

## Context

Visitors need to open a specific stone from its catalog photo and read the full
biography. The supplied detail mockup contains unsupported attributes and actions,
which the user excluded. The user subsequently added a gallery and backend MinIO
storage, with the first added photo as the default main image. The UI must retain
independent mock startup and use the existing placeholder for gallery images.

## Decision

### Page and navigation

Use a dedicated /stones/{id} page, linked from catalog photos, with direct entry,
refresh, browser history and an explicit Back to catalog link. Keep Header/Footer
unchanged. Display only contract-backed identity, type/size, status, admission
date and full biography. Exclude invented geological measurements/origin,
favorites, found-in-nature badge, chatbot and adoption controls.

Retain catalog state within the current application session above page switching,
including filter drafts/errors and sidebar state, and restore catalog scroll.
Use existing React and the browser History API for the two routes, preserving
standard link behaviors. No routing or global-state dependency is required.

### Gallery and mocks

Render one selected large image with a thumbnail carousel directly below it.
Initial selection and catalog cover use first successful addition order, never
filename, timestamp sorting alone or current preview selection. Clicking a
thumbnail changes the preview without changing stored order or main photo.
No automatic advance, lightbox, photo deletion, reordering or main-photo editor.

Keep the same 30 mock stones, with representative zero/one/multiple-photo cases.
Every mock gallery image uses the supplied placeholder-rock.png at the user's
request; distinct photo identifiers and selection controls make the behavior
reviewable despite identical bitmaps. Production files are stored in MinIO.

### Backend contract and persistence

Add ordered photos to StoneResponse, with each entry containing id, url, addedAt
and position. Keep legacy create/update photo strings intact; read-side photo
projects the first managed gallery image when present, otherwise the legacy
value. Search returns the cover without embedding every gallery.

Upload one file through POST /api/v1/stones/{id}/photos. Return its dedicated DTO
with 201 after successful attachment. Accept JPEG/PNG/WebP up to 10 MiB; missing
or corrupt data is 400, unsupported/mismatched media type 415, size violation
413 and storage unavailable 503, using custom exceptions translated by the handler.
Controllers, services, repositories and mappers retain constitutional boundaries.

Store bytes in a private MinIO bucket, metadata/object references in PostgreSQL,
using new Liquibase changesets. Server-assigned zero-based positions and a unique
per-stone position constraint make ordering stable; repository locking serializes
concurrent additions. Keep environment-only endpoint/bucket/credential settings.
Use browser-reachable presigned URLs lasting one hour; never persist signed URLs
as the canonical object reference or expose storage credentials.

Use explicitly pinned MinIO server and SDK versions documented in
[ADR-0001](0001-stack-versions.md). The SDK supplies S3 object operations/signing
not provided by the existing stack. Registry verification found the official
Docker Hub image unavailable (404) and Quay inaccessible anonymously (401).
Build the unchanged pinned MinIO release locally from its official GitHub binary,
with published SHA-256 verification and pinned Alpine base; Compose and tests
share that build definition. This keeps real storage verification reproducible.
WebP validation also uses the pinned TwelveMonkeys ImageIO decoder because
structural headers alone cannot reject corrupt compressed data. JPEG/PNG use
the existing JDK decoder. The frontend requires no added dependency.

### Storage failure compensation

Object storage and the database do not share an atomic transaction. Persist
cleanup intent before upload independently of metadata attachment. Successful
attachment removes that intent in the metadata transaction; failures attempt
immediate object cleanup and retain durable delayed retry when necessary.
Upload orchestration runs without a database transaction and delegates to a
separate transactional attachment service after validation and intent creation.
Attachment rechecks the stone and locks both stone and intent before storing and
attaching the photo. This avoids reserving a second database connection while
concurrent requests already hold connections waiting for the same stone lock.
Compensation starts after rollback has completed.
On stone removal, queue managed keys transactionally and clean after commit.
Failures starting or performing post-commit cleanup are logged for durable retry;
they cannot turn an already committed deletion into a failed HTTP response.
Cleanup never owns legacy external URLs and must not delete attached photos.
This queue serves photo consistency only; no new message broker is introduced.

### Scope boundaries

The browser continues through the mock API boundary; real backend upload/storage
is verified independently. Live frontend API integration, volunteer upload UI,
adoption submissions and all other excluded controls require separate scope.

## Consequences

The catalog can gain detail navigation without requiring backend availability.
The selected stone and photo order are explicit across API, UI and storage.
New metadata and cleanup tables introduce real persistence responsibilities;
failure/concurrency testing is necessary. Presigned URLs expire and future live
integration must fetch fresh detail/cover URLs as needed. Existing photo strings
are preserved without automatically importing arbitrary external resources.

## Alternatives Considered

- Replace the legacy photo field outright: rejected in favor of additive galleries.
- Store file bytes in PostgreSQL: rejected; database owns metadata, MinIO owns bytes.
- Choose primary by filename or timestamp only: rejected due to unstable ordering.
- Change main photo when a visitor browses thumbnails: rejected; preview is local.
- Add a carousel/routing/global-store library: unnecessary for this feature's scope.
- Treat a database transaction as storage rollback: rejected; explicit compensation
  and retry are required.
- Implement buttons and characteristics shown in the mockup beyond accepted scope:
  excluded by the user's instructions.
