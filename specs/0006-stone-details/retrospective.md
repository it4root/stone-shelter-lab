# Retrospective: Feature 0006

## Delivered Scope

The catalog photo now opens a responsive stone details page with the complete
biography and an ordered thumbnail gallery. The existing 30 mock stones and
placeholder asset keep the UI independent of backend availability. Catalog
filters, sort, pagination, sidebar and scroll survive navigation within the
session. Backend uploads store real image bytes in private MinIO objects and
photo metadata in PostgreSQL through new Liquibase changesets.

## Decisions That Helped

- Documenting exclusions prevented unsupported mockup fields, favorites,
  chatbot and adoption controls from entering this feature.
- Local preview selection remains separate from persisted addition order.
  The first successfully added photo consistently supplies the default cover.
- React and the browser History API covered the two required routes without
  additional frontend libraries. Feature-owned catalog state persists above
  page switching without introducing a speculative global store.
- Durable cleanup intent covers the database/object-storage transaction gap.
  Object removal failures retain retry work without deleting attached images.

## Findings Resolved During Verification

- Header checks alone accepted a corrupt WebP payload. A pinned ImageIO decoder
  now validates compressed image data alongside JPEG/PNG validation.
- Nested upload transactions could exhaust the connection pool under competing
  requests. Independent intent creation followed by transactional attachment
  removes that dependency; verification exceeds the default pool size.
- Cleanup failures after a committed deletion must not report deletion failure.
  Best-effort cleanup logs errors while durable work remains available for retry.
- The official prebuilt MinIO image was unavailable from the tested registries.
  A shared Dockerfile builds the unchanged official release from checksum-verified
  binaries for Compose and Testcontainers.
- Oversized multipart requests initially caused a disconnected client. Tomcat
  request swallowing is configured to preserve the specified 413 ProblemDetail.
- Backend null values required explicit nullable DTO types. Frontend fallback
  coverage now includes those values as well as missing and broken images.

## Deferred Work

Live frontend HTTP integration, volunteer uploads and adoption applications need
separate specifications. Presigned read URLs expire after one hour; future live
integration must request fresh metadata. Production client-route hosting remains
outside this scope. [Acceptance evidence](acceptance.md) records the final checks;
[ADR-0006](../../docs/adr/0006-stone-details.md) records the accepted decisions.
