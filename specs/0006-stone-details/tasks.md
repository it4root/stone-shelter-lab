# Tasks: Feature 0006

Execute all tasks authorized by the user. Do not commit or push without an
explicit request. Each task uses the repository-wide T0006-NNN convention.
Acceptance and verification evidence live in [acceptance.md](acceptance.md).

- [x] **T0006-001 — Finalize implementation decisions and contracts.**
  Fill plan/tasks; document formats, limits, signing, order, compensation,
  mock placeholder galleries and current scope before implementation.
- [x] **T0006-002 — Add MinIO infrastructure and photo metadata persistence.**
  Pin SDK/server, update Compose/env/settings, add new Liquibase metadata and
  durable cleanup changesets, entities/repositories and verify compile/schema.
- [x] **T0006-003 — Implement backend upload, ordered reads and cleanup.**
  Add multipart DTO/controller, storage service, validation/custom errors,
  mappers, concurrency-safe ordering, first-cover projection and compensation.
- [x] **T0006-004 — Verify backend storage and generated contract.**
  Add PostgreSQL/MinIO and controlled failure/concurrency tests, extend generated
  OpenAPI tests; run full Maven verification and record results.
- [x] **T0006-005 — Extend frontend mock data and API DTO boundary.**
  Add detail/photo DTOs, lookup by id and placeholder-only zero/one/multiple
  galleries for the existing 30 stones; verify data and cover semantics.
- [x] **T0006-006 — Implement catalog-to-details navigation and state retention.**
  Add routes, accessible photo links, direct/refresh/not-found behavior,
  history/back link and retained catalog state/scroll with meaningful tests.
- [x] **T0006-007 — Build responsive details and thumbnail carousel.**
  Render supported fields/full biography, reusable gallery and keyboard/touch
  selection, finite overflow controls, fallback images and responsive CSS.
- [x] **T0006-008 — Verify acceptance and complete documentation.**
  Run required frontend checks, Chrome responsive/keyboard/history checks,
  audit acceptance/backend evidence, record ADR/retrospective and keep UI running.

## Verification Records

T0006-001: requirements, links and task numbering reviewed; runtime checks follow
implementation tasks. No code or commit belongs to this preparation task.

T0006-005/006/007: frontend lint, 46 tests (7 files) and production build passed.
Same 30 identities have placeholder-only galleries; tests cover lookup/cover,
full biography, UTC date/status, History API, modified clicks, catalog state/scroll,
unknown routes, gallery selection/fallback and resize behavior. Chrome checks at
1440/1024/768/390/320 pixels passed with no page overflow. Keyboard Enter switches
photos; thumbnail navigation works. Direct refresh resets to first photo; zero/
single states and malformed/unknown ids passed. Browser Back/Forward and explicit
back retain two size filters, OLDEST sort, page 2, closed sidebar and scrollY 200.
Local UI remains running at http://localhost:5174/ (HTTP 200).

T0006-002/003/004: ./mvnw verify passed on JDK 23.0.2: 145 tests, zero
failures, errors or skips. Includes 12 real PostgreSQL/MinIO gallery tests,
generated JSON/YAML contract, legacy CRUD, mapper and ArchUnit checks.
Verification covers JPEG/PNG/WebP, corrupt/empty/missing/oversized uploads,
12 concurrent additions, equal timestamps, first-cover projection, storage and
metadata failures, durable compensation/retry, attached-object protection and
committed deletion success when cleanup cannot query the database.

T0006-008: all acceptance criteria verified on 2026-10-06. Compose builds and
runs the pinned MinIO binary with checksum verification; PostgreSQL, API and
MinIO are healthy. A temporary stone received two copies of the existing
placeholder: private access, signed byte retrieval, first cover and persisted
photo ids/timestamps/positions survived restarting API and MinIO. Deleting that
stone returned 200 and both managed objects became 404; temporary data was removed.
Generated OpenAPI is served by the running API. UI was restarted with pinned
Node 24.21.0 at http://localhost:5174/ and returns 200 for the detail route.
Plan, ADR, acceptance, retrospective and run instructions are complete.
No commits or pushes were created; unrelated engineering notes were preserved.
