# Tasks: Feature 0007 — Adopt a Stone

Requirements: [spec.md](spec.md). Technical decisions: [plan.md](plan.md).
Acceptance criteria are maintained only in [acceptance.md](acceptance.md);
references below identify coverage without duplicating criteria.

## Execution Boundaries

The user has authorized continuous implementation and verification of all tasks
T0007-001 through T0007-007 without stopping between tasks. After each task, run
its checks and report one line with the full ID. The user subsequently authorized
local commits. Use one task per commit with the exact `0007-adopt-stone:` prefix.
No push is authorized.

## Ordered Checklist

- [x] **T0007-001 — Add reservation persistence model and migration.**
  Add the new Liquibase table/constraints, entity and repository according to the
  plan; retain existing stone deletion through dependent-record cleanup.
  Verify schema with PostgreSQL Testcontainers, unique stone association and
  existing deletion compatibility. Run backend verification.
  Dependencies: none. Acceptance references: AC-27, AC-28.

- [x] **T0007-002 — Implement atomic reservation creation.**
  Add shared request/response DTOs, entity/DTO mappers, protocol-independent
  conflict exception and transactional service using the existing stone row lock.
  Add behavior tests for persistence, status checks, duplicates, concurrent
  requests, rollback and independent stones; verify persisted data through a
  fresh persistence context and retain architecture boundaries.
  Run backend verification.
  Dependencies: T0007-001. Acceptance references: AC-17, AC-19, AC-21–AC-26, AC-30.

- [x] **T0007-003 — Expose and verify the reservation HTTP contract.**
  Add the controller and conflict handler mapping; generate schema descriptions
  from shared DTOs. Add HTTP and generated JSON/YAML contract tests. Verify the
  new operation and unchanged catalog/photo routes with `./mvnw verify`.
  Dependencies: T0007-002. Acceptance references: AC-16–AC-22, AC-27, AC-29, AC-30.

- [x] **T0007-004 — Add frontend DTOs and stateful mock reservation boundary.**
  Align API types with generated backend OpenAPI; add asynchronous reservation
  operation, isolated runtime mock reservation/status state and overlay-aware
  catalog/detail reads. Test success, duplicate/concurrent attempts, unavailable
  and missing ids, independent stones and fixture immutability.
  Run frontend lint, tests and build; retain/reuse the local UI server.
  Dependencies: T0007-003. Acceptance references: AC-10, AC-13, AC-15, AC-31–AC-33.

- [x] **T0007-005 — Build the detail action and accessible reservation form.**
  Place the action according to the existing mock; compose the feature modal
  with stone summary, image fallback, labelled fields and basic validation.
  Implement responsive layout, opening/closing, focus and scroll management,
  eligible-status guards and isolated form state. Update the old feature 0006
  test that asserted adoption controls were absent to preserve its other exclusions.
  Run frontend lint, tests and build; retain/reuse the local UI server.
  Dependencies: T0007-004. Acceptance references: AC-01–AC-10, AC-34.

- [x] **T0007-006 — Connect mock submission, success and retry feedback.**
  Connect the form to the API boundary, implement pending/duplicate-click handling,
  same-modal success, updated detail status and retained-input errors/retry.
  Add deterministic interaction tests for success, pending, failure and stale
  status, including focus restoration after success disables the action.
  Run frontend lint, tests and build; retain/reuse the local UI server.
  Dependencies: T0007-005. Acceptance references: AC-07, AC-11–AC-15, AC-33, AC-34.

- [ ] **T0007-007 — Verify acceptance and record implementation evidence.**
  Run full backend/frontend checks and browser responsive/keyboard/modal/history
  verification. Audit every acceptance reference; record actual evidence and
  update task verification records. Fill the existing retrospective after work
  is complete, without expanding scope. Leave the UI running and report its URL.
  Dependencies: T0007-001–T0007-006. Acceptance references: AC-01–AC-35.

## Verification Records

Documentation preparation: spec, acceptance, plan and ordered tasks written in
English. Implementation was subsequently authorized continuously.

T0007-001: full Maven verify passed on JDK 23.0.2 with PostgreSQL/MinIO
Testcontainers, including unique reservation persistence and dependent deletion.
Docker Desktop was started for verification; no versions or applied migrations
were changed.

T0007-002: full Maven verify passed; six service/mapper tests cover atomic
creation, fresh database reads, eligibility, per-stone uniqueness, six concurrent
attempts, rollback after flush and retry. Existing architecture checks passed.

T0007-003: full Maven verify passed with reservation HTTP tests for validation,
missing/unavailable stones, duplicate and concurrent requests, rollback/retry
and deletion. Generated JSON/YAML contract checks passed. ProblemDetail type is
explicitly serialized as about:blank under Spring 7.

T0007-004: lint, 51 frontend tests and production build passed. Mock reservation
creation is asynchronous at the API boundary, serializes same-stone attempts,
projects RESERVED in search/detail reads and preserves base fixtures.

T0007-005: lint, 59 frontend tests and production build passed. The action and
modal components cover stone identity, first-photo fallback, labelled arbitrary
text, blank validation, focus containment/restoration, inert background, scroll
locking, Escape and clean form reopening. Page/boundary wiring follows T0007-006.

T0007-006: lint, 66 frontend tests and production build passed after connecting
the action to StoneDetailsPage. Controlled tests cover same-modal success,
precise submission identity, pending duplicate clicks, retained-input manual
retry, stale eligibility, disabled post-success action and navigation readback.


T0007-007 (partial): final frontend lint, 68 tests and build passed. Final backend
code was verified by full Maven verify (178 tests, no failures/errors/skips).
Compose build/start and API restart smoke passed; durable reservation fields,
RESERVED, duplicate 409 and dependent deletion were verified with disposable data.
Documentation links, source roots, scope and git diff whitespace checks passed.
README/glossary and retrospective are updated; UI remains running at
http://127.0.0.1:5174/ on pinned Node/npm. Compose dependencies are healthy.
Native responsive/keyboard browser checks remain blocked: computer-use tools
report no browser surfaces, and Chrome/in-app browser creation is unavailable.
No visual passes are claimed; keep this task unchecked until those checks run.
Implementation verification preceded commit authorization. No pushes, dependency
changes or applied-migration edits were made.

Commit preparation: after explicit user authorization, implementation changes
were grouped by task with the required feature prefix. Frontend lint, all 68
tests and production build were rerun successfully before each frontend commit.
Unrelated engineering notes were excluded. The remaining native browser check
is still open; committing verification evidence does not complete T0007-007.
