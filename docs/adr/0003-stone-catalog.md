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
- The existing `contracts/stone-shelter-api.yaml` remains a draft rather than
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
  Stones. The exact search path and request-body shape must be specified before
  search implementation; they were not selected by this instruction.
  Exclude PATCH; PUT is full replacement, including clearing omitted optional fields.
- Keep biography optional with a maximum of 2048 characters. Photo remains an
  optional placeholder string of at most 500 characters: normalize `""` to
  `null`, without URL validation or whitespace trimming.
- Replace the original calendar-date decision with a client-supplied RFC3339
  timestamp with an explicit offset. Model it as `Instant`, store it as
  `TIMESTAMP WITH TIME ZONE` and return UTC `Z`. Reject values later than the
  current instant, including later on the same day.
- Allow one sort field only; reject multi-sort with 400. Use separate search
  properties `sortBy` (name or stoneSize, default name) and `sortDirection`
  (asc or desc, default asc). The previously selected GET `filter` deepObject
  query representation is superseded by the POST search decision; the new
  request representation remains to be defined. Retain pagination defaults,
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
  timestamps, photo normalization, length boundaries and seed lifecycle.
- Changed unverified coverage from `auto` to `none`; existing criterion IDs and
  positions were preserved. Reworked AC-35 for multi-sort and added separate
  checks for omitted direction and invalid sorting.
- Corrected the glossary reference and duplicate task ID. Detailed requirements
  remain in the feature documents; this ADR summarizes decisions and changes.
- The POST search path and request representation remain open decisions.
  OpenAPI completion
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
