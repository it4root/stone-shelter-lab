# Implementation Plan: Feature 0007

## Execution Scope

The user authorized all tasks T0007-001 through T0007-007 in [tasks.md](tasks.md)
to be implemented and verified continuously. Acceptance is maintained exclusively
in [acceptance.md](acceptance.md). The user subsequently authorized local commits;
use one task per commit. No push is authorized.
Preserve unrelated engineering notes and staged files.

Use existing pinned dependencies/runtime versions from ADR-0001 and ADR-0002.
No new dependency, service process, HTTP client, global state library or UI
framework is needed. Real backend persistence and mock UI are separate deliverables.

## Backend Schema and Data Model

Add a new `0007` Liquibase changeset and include it in the master changelog.
Create `stone_reservation` with:

| Column | PostgreSQL type / constraint |
| --- | --- |
| id | BIGINT generated primary key |
| stone_id | BIGINT NOT NULL, foreign key to stone(id), UNIQUE |
| applicant_name | TEXT NOT NULL |
| contact_details | TEXT NOT NULL |
| created_at | TIMESTAMP WITH TIME ZONE NOT NULL |

Use TEXT rather than inventing business length limits. Use ON DELETE CASCADE on
the stone foreign key to retain existing stone deletion behavior; no reservation
deletion endpoint is added. Creation timestamps and identifiers are server-owned.
Do not alter applied changesets or seed extra stones/reservations.

Add `StoneReservationEntity` as a class with private fields, no-argument
constructor and accessors (it has more than four fields). It refers to the stone
entity/id without copying stone display data. Add `StoneReservationEntityRepository`
for persistence and existence lookup by stone id.

## Transaction and Concurrency

Add `StoneReservationService` with class-level `@Transactional` and a `create`
operation accepting the original Request DTO plus path id. Reuse the existing
`StoneEntityRepository.findByIdForUpdate` row lock rather than introducing new
locking infrastructure or JPA APIs in services.

Within one transaction, lock/find the stone, translate absence to the existing
StoneNotFoundException, check `AVAILABLE` and absence of a reservation, set
`RESERVED`, map/save the reservation and obtain the ready response through a DTO
mapper. Check existing reservations even if the current stone status is AVAILABLE,
because the existing catalog update operation can change statuses. Preserve that
catalog operation's contract; reservation cancellation/reopening is not introduced.

The row lock serializes reservation attempts for the same stone. The unique
constraint supplies a second integrity boundary. Translate known duplicate
reservation failures into the protocol-independent reservation conflict exception
and HTTP 409; do not mask unrelated database failures as conflicts. Flush inside
the transaction when needed to observe constraint failures. Let failures roll
back both reservation insertion and the stone change. Do not retry transactions
automatically or treat duplicate submission as another success.

Keep existing delete locking and photo cleanup behavior. Test the foreign-key
cleanup using the public existing delete operation. No dependency on MinIO is
needed to create a reservation.

## DTOs, Mappers and HTTP Boundary

- `StoneReservationCreateRequest`: applicantName and contactDetails, both
  Bean Validation `@NotBlank`, with English schema descriptions.
- `StoneReservationCreateResponse`: id, stoneId, adoptionStatus and createdAt.
  Both DTOs may be records because they have at most four fields.
- `StoneReservationCreateRequestToStoneReservationEntityMapper` extends
  AbstractEntityMapper; map applicant fields through `toEntity`, using setters.
  The service assigns the associated stone and server timestamp.
- `StoneReservationEntityToStoneReservationCreateResponseMapper` extends
  AbstractDtoMapper; `toDto` builds the complete response. Reuse AdoptionStatus
  and existing timestamp serialization.
- `StoneReservationController` owns POST routing, JSON binding, `@Valid`, path id
  and `@ResponseStatus(HttpStatus.CREATED)`. It returns the ready Response DTO
  directly, without ResponseEntity, mapping or business logic.
- A custom exception under `lab.stoneshelter.exceptions` represents unavailable
  or already reserved stones. ApiExceptionHandler translates it to 409
  ProblemDetail; reuse existing not-found, validation and unexpected-error handling.

Spring 7 leaves the default ProblemDetail type unset. Set `about:blank` explicitly
in the existing handler for custom and framework validation failures so the
required type field is serialized; do not weaken the contract checks.

Do not repeat Bean Validation in services or normalize valid arbitrary text.
Generate OpenAPI from the controller/shared DTOs; verify JSON/YAML without a
separate handwritten schema or changes to global success-only documentation.

## Frontend Boundary and Runtime Mock State

After the backend generated contract is available, add matching request/response
types under src/api/dto and an asynchronous `createStoneReservation` operation
under src/api. Keep catalog/detail reads synchronous for this mock phase.

Implement the operation in src/mocks/api using the existing fixtures plus a
runtime reservation/status overlay. Check the current status and duplicate
reservation before writing; avoid yielding between the final check and runtime
write so concurrent mock attempts cannot both succeed. Reads merge the overlay
without mutating base fixtures or exposing applicant data through stone DTOs.
Reset only this runtime state between tests; navigation keeps it, full reload may
reset it. No localStorage, mock HTTP server or production HTTP client is needed.

Use controlled adapter mocks/deferred promises in tests for pending, failure and
conflict outcomes. Do not add failure toggles to the visitor UI or invent random
failures. The mock response matches the backend response, including timestamp,
reservation id and RESERVED status.

## Feature UI and Accessibility

Keep reservation presentation and state under src/features/adopt-stone, composed
from the existing StoneDetailsPage. Add only components/hooks with actual
responsibilities. Keep PascalCase component directories, colocated styles/tests
and existing tokens. Shared Header/Footer and App do not own reservation state.

Use a small local hook or reducer for editing/submitting/success/error and a
feature modal component for the stone summary, fields and feedback. Reuse
available image fallback presentation and modal mechanics where suitable;
inspect existing sidebar focus/scroll behavior before duplicating infrastructure.
No forwarding-only service or global provider is required.

Use native form controls with required text fields and a text contact input,
not email/tel syntax validation. Await the mock boundary operation, prevent
duplicate submission while pending and retain input on failures. On success,
update/re-read the details through the API boundary and replace the form inside
the same modal with the prescribed English message and a green checkmark. Use
an inline vector/CSS checkmark; no raster asset generation is needed.

Use semantic dialog/focus management with Escape and close control, background
inertness and scroll locking. Announce status/errors, associate field errors and
restore focus on close, including after the opener becomes disabled on success
(use a programmatically focusable action wrapper as the restoration target if
the disabled button cannot receive focus). Keep summary above fields and handle
long content at 320 pixels without horizontal overflow.

## Verification Strategy

Run task-appropriate checks after each separately authorized task and report its
full task ID and result in one line. Test behavior and guarantees rather than
mirroring implementation or reasserting framework internals.

Backend tests use existing PostgreSQL Testcontainers infrastructure. Each test
creates and cleans its own data; shared infrastructure does not mean shared
mutable fixtures. Cover successful atomic persistence, validation, unavailable
and missing stones, duplicates, concurrent attempts, transaction rollback,
restart-equivalent fresh-context/reload persistence, existing delete behavior and
generated JSON/YAML contract. Keep architecture rules under ArchUnit.

Frontend checks use the existing Vitest/Testing Library setup for mock operations,
validation, pending clicks, retained input/retry, success, selected identity,
availability guards and dialog keyboard behavior. Run `npm run lint`,
`npm run test -- --run` and `npm run build` after frontend changes. Perform browser
checks at 1440/1024/768/390/320 pixels for modal layout, keyboard, scrolling,
success/error and catalog/detail navigation. Leave the local UI server running
and report its URL after frontend verification.

Final verification runs `./mvnw verify` on JDK 23.0.2, all three frontend commands
on pinned Node/npm and compares implementation with acceptance.md. Record actual
results and any failures in tasks.md and acceptance.md; do not claim passes before
execution. No additional task is authorized by completing a verification step.
