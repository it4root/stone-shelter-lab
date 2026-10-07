# Feature 0007: Adopt a Stone by Creating a Reservation

## Goal

Let a visitor begin adoption from a stone's details page by providing their name
and contact details in a modal. Successful submission reserves the stone; it
does not complete adoption. Implement the visitor flow using mock data and the
real backend reservation operation independently.

## Scope and Relationship to Earlier Features

- Extend the details page delivered by [feature 0006](../0006-stone-details/spec.md).
  This feature brings its deferred detail adoption action into scope. Other
  exclusions and catalog/detail/gallery requirements remain unchanged.
- Use [stone_details_mock.png](../0006-stone-details/stone_details_mock.png) for
  the action's location and visual direction: `Adopt this stone` belongs in the
  stone information block beside the main image, before the characteristics.
  Keep the shared Header and Footer unchanged.
- Only `AVAILABLE` stones can be reserved. Submission creates a reservation
  and changes the stone's adoption status to `RESERVED`.
- At most one reservation may exist for a stone, regardless of the applicant's
  name or contact details. Repeated and concurrent submissions cannot create
  additional reservations.
- Store the relationship using the stone's id. Do not copy the stone's name,
  photo URL or image bytes into the reservation.
- The UI continues to use the same 30 mock stones through the API boundary and
  works without a backend, database or MinIO. Backend persistence and HTTP
  behavior are implemented and verified separately; live UI/backend integration
  is deferred.

## Detail Action and Modal

Show `Adopt this stone` in the details content. Enable it for `AVAILABLE`; disable
it for `RESERVED` and `ADOPTED`, keeping the stone's current status visible.
Opening the modal does not create a reservation or change the status.

The modal contains:

1. A summary of the selected stone: photo beside its actual name and id.
2. Below the summary, two labelled fields: `Your name` and `Contact details`.
3. A separate `Submit application` button and a clearly labelled close control.

Use the first gallery photo, or the existing legacy cover when the gallery is
empty, then placeholder-rock.png for a missing or failed image. Changing the
large gallery preview does not change the modal's default photo. Stone summary
data is read-only and must belong to the selected id, independently of catalog
filters, sorting or pagination. On narrow screens the summary may stack; both
fields remain below it.

Both fields accept arbitrary text, including names and contacts that are not
phone numbers or email addresses. Require nonblank input: omitted/null values,
empty strings and whitespace-only strings are invalid. Show field-associated
English errors and do not submit invalid input. Do not add phone/email patterns,
account lookup, prescribed contact channels or business maximum lengths. Preserve
valid entered text; whitespace checks do not require rewriting its value.

Use the existing light background, green accents, typography, spacing and rounded
treatment. The modal must fit a 320-pixel viewport without horizontal overflow
and permit vertical scrolling for smaller heights or long content. Provide an
accessible dialog name, labelled fields, visible keyboard focus, focus containment,
an inert background and background scroll locking. Support closing with the
close control and Escape and restore focus to the initiating action, or its
action area when success has disabled the button.

## Submission and Result

Keep modal state local to the feature: editing, submitting, success or error.
Disable repeat submission while a request is pending and expose the pending state.
Send only the selected stone id and the two applicant fields through the API
boundary. Availability and duplicate checks belong to the data source/backend;
the page's previously displayed status is not sufficient authority.

On success, keep the same modal open and replace the form with a green checkmark
and the exact English message:

`Application submitted. Please wait for us to contact you.`

Expose the success message to assistive technology; the checkmark is not the
only confirmation. Do not redirect or imply that the stone is already `ADOPTED`.
Update the details status to `Reserved` and disable another reservation attempt.
Subsequent catalog/detail reads in the current mock runtime must agree with the
updated status.

On failure, keep the modal open, preserve the entered fields, show an accessible
English error and allow the visitor to retry when the stone is still eligible.
An unavailable, already reserved or deleted stone cannot be bypassed by retry;
show the corresponding failure without a success checkmark. Closing an unsubmitted
form does not write data. Opening a form for another stone must not carry over
the previous stone's applicant data or success state.

## Reservation and Persistence

A reservation contains its generated id, the associated stone id, applicant name,
contact details and server-assigned creation timestamp. The backend stores these
in PostgreSQL using a new Liquibase migration. Applied migrations are unchanged.
Keep the stone relationship non-null and unique. No separate applicant account,
reservation status lifecycle or copied stone snapshot is needed.

Creating the reservation and changing `AVAILABLE` to `RESERVED` form one database
transaction. A failed operation must not leave a reservation without its status
change or a status change without the reservation. Concurrent attempts for the
same available stone produce one successful reservation and conflicts for the
remaining attempts. Attempts for different stones remain independent.

Existing stone reads/searches expose the changed adoption status without adding
applicant data to stone DTOs. Preserve existing stone deletion and gallery cleanup:
deleting a stone also removes its dependent reservation, without orphan records.
Changing a stone's status through existing catalog maintenance does not erase its
reservation or permit a second reservation for that same stone id.

## HTTP Contract Requirements

Generated `/v3/api-docs` and `/v3/api-docs.yaml` are the HTTP contract source of
truth under [ADR-0004](../../docs/adr/0004-generated-openapi.md). Define behavior
here before implementation; generate documentation from controllers/shared DTOs
and do not maintain handwritten OpenAPI files.

Add `POST /api/v1/stones/{id}/reservations` with an `application/json` body using
a dedicated `StoneReservationCreateRequest`:

| Field | Requirement |
| --- | --- |
| applicantName | Required nonblank string; arbitrary text |
| contactDetails | Required nonblank string; arbitrary text |

The path supplies the stone id. The request does not supply a reservation id,
creation timestamp, desired adoption status, stone name or photo.

Return HTTP 201 with a dedicated `StoneReservationCreateResponse`:

| Field | Meaning |
| --- | --- |
| id | Generated reservation identifier |
| stoneId | Identifier of the reserved stone |
| adoptionStatus | `RESERVED` after successful creation |
| createdAt | Server-assigned timestamp, serialized in UTC with `Z` |

Do not add a Location header. Runtime failures use RFC 9457 ProblemDetail:

| HTTP status | Condition |
| --- | --- |
| 400 | Invalid/missing request body or missing/null/empty/whitespace-only required fields; malformed path id |
| 404 | No stone exists for the supplied id |
| 409 | Stone is not `AVAILABLE` or a reservation already exists for it, including a concurrent losing submission |
| 500 | Unexpected persistence failure; no partial reservation/status change |

Generated OpenAPI must describe the operation, JSON request, required string
fields, dedicated response and successful 201 status. Retain ADR-0004's current
success-only response documentation policy; runtime error behavior is specified
above and verified by tests, without changing global documentation settings.

## Mock Boundary and Architecture

Add reservation request/response types under `src/api` aligned with the generated
backend contract. Add an asynchronous reservation operation at the API boundary
delegating to a mock adapter. Existing synchronous catalog/detail reads need not
be converted to HTTP or made asynchronous.

The mock adapter owns runtime reservation data and status changes, checks current
availability and prevents duplicates. Do not mutate the imported base fixtures
or let components import mock datasets. Mock reservations last for the current
loaded application runtime, including navigation between catalog and details;
reload may restore the original fixtures. No localStorage or durable mock database
is required. Tests must be able to exercise pending, conflict and retryable failure
paths deterministically without adding visitor-facing simulation controls.

Follow [ADR-0005](../../docs/adr/0005-ui-mock-to-code.md): feature-owned components
and state under `src/features`, reusable stone presentation under `src/domain/stone`,
API types/access under `src/api` and mock adapters under `src/mocks`. Each component
has its own PascalCase directory with colocated styles/tests. App remains composition.

Backend controllers own binding, `@Valid` and HTTP statuses; services own business
checks, transactions and mapper calls; repositories own entities, queries and
locking. Shared Request/Response DTOs live in `lab.stoneshelter.shared`. Follow
existing mapper naming, null policies and returned-transformation contracts.
Use existing dependencies and pinned versions; no new library is planned.

## Excluded Scope

- Live frontend/backend integration or a mock HTTP server.
- Header or catalog-card adoption controls, favorites or chatbot behavior.
- Authentication, user accounts, structured phone/email validation or contact verification.
- Notifications, actual calls/messages, payments, delivery or completed adoption.
- Reservation expiry, cancellation, editing, approval/rejection, management UI
  or reservation listing/read/update/delete endpoints.
- Persistent browser mock storage, automatic retries or an idempotency-key API.
- Gallery mutation, new images or changes to unrelated catalog navigation/filtering.

## Acceptance and Execution

Acceptance criteria live exclusively in [acceptance.md](acceptance.md). Technical
decisions and verification strategy are in [plan.md](plan.md); the ordered task
checklist is in [tasks.md](tasks.md).

The user has authorized continuous execution of all tasks T0007-001 through
T0007-007, including implementation and verification, without stopping between
tasks. The user subsequently authorized local commits, following the repository's
one-task-per-commit rule. No push is authorized.
