# ADR 0003: Stone Catalog requirements clarified

Date: 2026-10-04

Status: Accepted

## Context

T0003-001 reviewed the Stone Catalog specification, plan, acceptance criteria
and glossary before writing the OpenAPI contract. Discussion resolved endpoint,
validation, sorting and development seed ambiguities. No implementation was
added during this review.

## Decision

- By explicit user instruction, defer completion of the OpenAPI YAML until the
  Stone controller is fully implemented. For this feature, implement the
  controller from the agreed specification, plan and acceptance criteria first,
  then create or update the YAML and verify it against those requirements and
  the implemented public API. This is a deliberate exception to the repository's
  contract-first workflow.
- The existing `../../stone-rules/stone-shelter-api.yaml` remains a draft rather than
  an approved source of truth for this implementation stage. Retain it for later
  revision; this decision does not delete it or authorize additional implementation
  tasks. Final contract completion is deferred, not cancelled.
- Replace the catalog list GET operation with one POST search operation.
  Use that same search operation for catalog browsing, filtering, pagination
  and sorting; do not introduce separate operations providing the same search
  behavior. The user selected POST so filtering can evolve within one operation.
  This changes catalog retrieval only: Stone creation remains POST, and
  individual Stone retrieval remains GET.
- Keep the `/api/v1/stones` API namespace and `/api/v1/stones/{id}` for individual
  Stones. Search uses POST `/api/v1/stones/search` with the approved
  StonesSearchRequest JSON body (filter, page, size, sort).
  Exclude PATCH; PUT is full replacement, including clearing omitted optional fields.
- Keep biography optional with a maximum of 2048 characters. Photo remains an
  optional placeholder string of at most 500 characters: preserve its value
  unchanged, including null, empty strings and whitespace. Do not process it.
- Replace the original calendar-date decision with a client-supplied RFC3339
  timestamp with an explicit offset. Model it as `Instant`, store it as
  `TIMESTAMP WITH TIME ZONE` and return UTC `Z`. Reject values later than the
  current instant, including later on the same day.
- Allow one sort field only; reject multi-sort with 400. Use separate search
  properties `sort.field` (explicit name or stoneSize; omitted defaults to
  admissionDate) and `sort.direction` (asc or desc; omitted defaults to desc
  for admissionDate and asc for explicitly selected name or stoneSize). The previously selected GET `filter` deepObject
  query representation is superseded by the approved POST search JSON body. Retain pagination defaults,
  supported filters and the page response envelope. Use semantic size ordering and `id ASC`
  for equal values in either direction.
- Sort names using PostgreSQL's database collation without `lower(name)` or
  other case normalization. No independent mixed-case order is required.
- Insert 50 development Stones covering every type, size and adoption status.
  Enable seed only through an explicitly activated Spring `dev` profile and
  apply it once per database using Liquibase tracking.

## Consequences

- Aligned endpoint paths, timestamp storage, sorting and seed rules in the plan;
  clarified the glossary's admission date as a moment in time.
- Appended acceptance checks for missing/null fields, malformed JSON, empty
  catalog, optional-field clearing, distinct IDs, tiebreakers, future and invalid
  timestamps, unchanged photo values, length boundaries and seed lifecycle.
- Changed unverified coverage from `auto` to `none`; existing criterion IDs and
  positions were preserved. Reworked AC-35 for multi-sort and added separate
  checks for omitted direction and invalid sorting.
- Corrected the glossary reference and duplicate task ID. Detailed requirements
  remain in the feature documents; this ADR summarizes decisions and changes.
- The POST search path and request representation are resolved by the approved
  controller and DTOs. OpenAPI completion
  originally assigned to T0003-002 is now deferred until the controller is fully
  implemented. Backend implementation and test execution remain separate tasks.
- Contract-dependent task wording must reflect this sequence before those tasks
  are executed. Final API verification must still compare the completed YAML,
  implementation and acceptance requirements.
- Update the specification, plan and catalog acceptance requests from list GET
  to the agreed POST search operation before implementing it. Preserve catalog
  behavior and validation requirements; the existing YAML remains a draft for
  later revision. This ADR update does not implement search or update other tasks.

## Alternatives

- Retain list GET alongside a separate POST search with equivalent catalog
  behavior: rejected in favor of one search operation.
- Finalize and approve OpenAPI before implementing the controller: superseded
  for this feature by the user's explicit decision to complete it afterwards.
- Calendar dates: superseded by the confirmed timestamp requirement.
- PATCH, multi-sort and case-normalized name sorting: excluded from this feature.
- Additional photo validation: deferred to future photo functionality.
- Implicit development seed or repeated insertion on startup: rejected.
- Marking planned tests as `auto`: rejected; coverage records actual verification.

## T0003-004 clarification

The approved search is POST `/api/v1/stones/search`, using the existing
StonesSearchRequest and StonesSearchResponse (`content`) DTOs. This resolves
the earlier open path and representation decisions. Controller bodies may be
implemented without changing signatures or DTO contracts. DELETE returns 200
with an id response. Development seed is deferred to a separate task.

Service responsibilities were clarified: services accept original controller
Request DTOs, perform additional business validation when needed, apply changes
and normalization, invoke mappers and return ready Response DTOs. Controllers
only handle HTTP binding, Bean Validation, delegation, statuses and headers;
they contain no business logic, perform no mapping and do not instantiate domain
models or persistence entities. Repositories work with entities and database queries only.
Entities may be used by services but never reach the controller/API boundary.

By explicit user decision, supported enum values are validated by the server,
not by database CHECK constraints. Keep string persistence and structural
column constraints; omit the three enum-value CHECK constraints.

Shared request/response DTOs and nested types live in `lab.stoneshelter.shared`,
alongside the service/domain package rather than inside `api`. Controllers and
services share these contracts; services have no dependency on the API package.
This package relocation does not change HTTP request or response schemas.

By explicit user decision, controllers return Response DTOs directly by default;
ResponseEntity requires an explicit task instruction. Creation methods use
@ResponseStatus(HttpStatus.CREATED). Stone creation no longer emits Location;
clients identify the created Stone using the response body's id.

Use standard Jackson conversion for admissionDate timestamps and serialize
Instant responses in UTC with Z. Remove AdmissionDateJsonConfiguration: a
field-specific requirement must not override Instant deserialization globally.

Entity-target mappers live in lab.stoneshelter.mappers.entities; DTO-target
mappers live in lab.stoneshelter.mappers.dtos. Both may access persistence
entities through public constructors and accessors. Services invoke mappers;
controllers and repositories do not. Existing full source-to-target names remain.

Mapper null policies use abstract templates with final public conversion methods.
Entity-target mapping returns null for null input; DTO-target mapping raises
MapperValidationException, handled as standard HTTP 500 ProblemDetail. Absent
records are still translated from Optional.empty to HTTP 404 in the service.
Concrete mappers are injected Spring components rather than static utilities.

Packages are grouped by responsibility: controllers, handlers, services, enums,
repositories, entities, criteria and exceptions. shared and mappers.entities /
mappers.dtos retain their roles. Previous api/domain/persistence locations are
superseded; dependencies keep the same architectural boundaries.

### Server-owned creation admission date (2026-10-08)

The user requested automatic backend dating when adding a stone in feature 0009.
Feature 0008 T0008-009 removes admissionDate from StoneCreateRequest and assigns
the current injected UTC Clock instant in the creation service before persistence.
Obsolete client values are ignored. Responses keep the existing field and UTC
representation. This supersedes the client-supplied creation timestamp decision;
full-replacement update validation, historical dates, date filters and sorting
retain their existing contracts. UI creation and the operator loader omit the
date, and the mock adapter mirrors server assignment. No migration is required.
