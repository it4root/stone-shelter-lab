# Retrospective: Feature 0007 — Adopt a Stone

Date: 2026-10-07.
Status: Implementation complete; automated verification passed; native browser
responsive/keyboard verification pending.

## Delivered Behavior

The details page now provides the mock-backed reservation flow through
`Adopt this stone`. The modal identifies the selected stone, accepts arbitrary
nonblank name/contact text, prevents duplicate pending submissions and shows
the prescribed same-modal green checkmark confirmation. Retryable failures keep
the input; unavailable/missing stones cannot be bypassed by retry.

The backend independently persists reservations by stone id. One transaction
creates a reservation and sets RESERVED; a stone row lock and a database unique
constraint prevent multiple reservations. The generated OpenAPI describes the
new POST operation. Live frontend/backend integration remains deferred.

## Decisions and Findings

- Existing Spring/JPA/Liquibase and frontend dependencies were sufficient.
  No dependency or version change was needed.
- TEXT columns preserve free-form contact information without invented lengths.
  ON DELETE CASCADE keeps the existing stone delete operation usable without
  introducing a reservation administration API.
- Reusing the existing per-stone write lock allowed concurrent reservation
  attempts to return one success and conflicts for the remaining requests.
- Mock runtime overlays keep imported fixtures immutable and allow catalog and
  details to share the updated status through their existing API boundary.
- The modal uses local feature state and a body portal. Focus restoration uses
  the action area when successful reservation has disabled the initiating button.
- HTTP verification revealed that Spring 7 does not set the default
  ProblemDetail type. The shared handler now explicitly sets about:blank so the
  required field appears in responses; tests were retained.

## Verification and Remaining Work

Full backend verification passed 178 tests on JDK 23.0.2 with real PostgreSQL/MinIO
Testcontainers. Frontend lint, 68 tests and production build passed on pinned
Node 24.21.0/npm 11.19.0. Compose smoke verified durable reservation fields and
status across API restart, duplicate rejection and dependent cleanup; temporary
data was removed. UI remains running at http://127.0.0.1:5174/.

Native visual/keyboard checks could not run because the computer-use session
exposes no browsers. Attempts to create Chrome or in-app tabs were unavailable.
Automated focus/history/modal tests and responsive CSS review are recorded as
such, without claiming a browser visual pass. T0007-007 stays open for that check.
Detailed evidence is in [acceptance.md](acceptance.md) and [tasks.md](tasks.md).

The user subsequently authorized local commits, one per task. No push is
authorized. Applied migrations and dependency manifests were preserved;
unrelated engineering notes are excluded from feature commits.
