# 0003 — Tasks

## Contract


- [x] **T0003-001 — Check the initial Stone Catalog OpenAPI contract.**
    - Read:
        - `spec.md`
        - `acceptance.md`
        - `plan.md`
        - `docs/glossary.md`
  - Report any ambiguity or conflict in the requirements.

  
## Backend implementation

- [x] **T0003-002 — Propose controller methods — do not implement**
- [x] **T0003-003 — Add StoneCatalogController and API DTO skeletons**
  - Add the agreed create, get, search, update and delete signatures.
  - Keep method bodies unimplemented: throw UnsupportedOperationException.
  - Use separate request and response DTOs; searchTerm is out of scope.
  - [x] Add domain enums and request validation for required fields, length limits,
    admission timestamps, pagination and sorting; add the validation starter.
  - [x] Add a temporary ProblemDetail handler for unimplemented operations.
  - [x] Replace unsupported-operation tests with forward-looking API behavior
    tests covering validation, CRUD, search, pagination, sorting and edge cases.
  - [x] Remove package-info.java files and use explicit controller imports;
    document the explicit-import rule in the constitution.

- [x] **T0003-004 — Implement controller operations end-to-end against PostgreSQL.**
  - Keep the approved controller signatures and DTO contracts unchanged.
  - Pass original Request DTOs to services and return ready Response DTOs.
    Services own business validation, normalization and mapping; controllers
    contain no business logic and do not instantiate domain models or entities.
  - Add domain models, service transactions, JPA persistence, repository and mappers.
  - Keep entity classes in persistence and entities out of the API layer; use no generic frameworks.
  - Add the Stone table through a new Liquibase migration with required columns,
    length limits and identity IDs. Supported enum values are validated by the server.
  - Implement CRUD, AND filters, pagination, whitelisted sorting, semantic size
    order and the id ASC tiebreaker; return 404 for missing Stones.
  - Preserve photo values unchanged and strictly parse timestamps with an explicit offset;
    return standard ProblemDetail errors including title, status and detail;
    the default about:blank type may be omitted.
  - Strengthen API tests for full replacement, pagination, optional fields,
    combined filters and sorting, and rejected-create persistence guarantees.
  - Clean up test-owned data independently of the DELETE endpoint and add
    architecture checks for JPA-free domain models and entity encapsulation.
  - Verification (2026-10-05): Maven verify on JDK 23.0.2 passed all 100 tests
    (94 catalog, 5 architecture, 1 bootstrap) with PostgreSQL Testcontainers.
    Application startup, Liquibase, Hibernate validation and actuator health pass.
    All 32 Java source files match their package paths; git diff --check passes.
  - Development seed and AC-65–67 are excluded and will be implemented separately.

  - Follow-up: move changes and mapper calls to the service;
    repositories accept/return entities. Update architecture rules accordingly.
  - Follow-up verification (2026-10-05): Maven verify passes all 101 tests,
    including the new rule prohibiting repository dependencies on mappers.
  - Follow-up: consolidate repositories into StoneEntityRepository extending
    JpaRepository and JpaSpecificationExecutor; remove the manual CRUD wrapper
    and use separate content/count specifications. Tests not run as requested.
  - Follow-up: move JPA search specifications and database sorting back to
    StoneEntityRepository; the service passes domain criteria and maps the entity page.
    Restore the domain-wide prohibition on JPA query dependencies. Tests not run.
  - Follow-up: add explicitly pinned Apache Commons Lang 3.20.0 and use
    StringUtils.isEmpty for photo normalization (superseded: photo values are now preserved unchanged).
  - Follow-up: use StoneSortField in domain search criteria, map approved API
    string values inside the service and use exhaustive enum ordering.
  - Follow-up: remove the three enum-value CHECK statements from the uncommitted
    table migration; document server ownership of supported-value validation.

  - Follow-up: make StoneCatalogController delegate original Request DTOs and
    return ready service Response DTOs; move request/entity/response mapping and
    search defaults into StoneService. Use dedicated source-to-target mappers
    and remove unused intermediate Stone, StoneValues and StonePage models.
    Allow service dependencies on API DTOs while keeping domain models independent;
    prohibit controller mapping and construction of domain models or DTOs.
  - Controller refactoring verification (2026-10-05): Maven verify on JDK 23.0.2
    passes all 103 tests (94 catalog, 8 architecture, 1 bootstrap) with
    PostgreSQL Testcontainers. HTTP behavior is preserved; git diff --check passes.

  - Follow-up: relocate all shared request/response DTOs and nested types from
    api.dto to lab.stoneshelter.shared; update imports and architecture checks
    to keep services independent of the API package. HTTP contracts stay unchanged.
  - Shared DTO relocation verification (2026-10-05): Maven clean verify on
    JDK 23.0.2 passes all 105 tests (94 catalog, 10 architecture, 1 bootstrap)
    with PostgreSQL Testcontainers. Package paths and git diff --check pass.

  - Follow-up: return StoneCreateResponse directly from createStone with
    @ResponseStatus(HttpStatus.CREATED); remove ResponseEntity and Location.
    Update the creation contract and acceptance checks before implementation.
  - Direct response verification (2026-10-05): Maven verify on JDK 23.0.2
    passes all 106 tests (94 catalog, 11 architecture, 1 bootstrap) with
    PostgreSQL Testcontainers. Creation returns 201 without Location;
    git diff --check passes.

  - Follow-up: remove photo normalization and its service calls. Preserve null,
    empty strings and whitespace unchanged; remove photo accessors used only for
    normalization. Update the specification, plan, ADR and acceptance checks.
  - Photo handling verification (2026-10-05): Maven verify on JDK 23.0.2
    passes all 106 tests with PostgreSQL Testcontainers. Create, update and GET
    preserve empty photo values; update and GET preserve whitespace.
    Null and omitted values remain null. git diff --check passes.

  - Follow-up: remove AdmissionDateJsonConfiguration and its global Instant
    deserializer. Use standard timestamp-to-Instant conversion and UTC Z output.
    Verify timestamp behavior through the existing catalog API tests.
  - Standard Instant conversion verification (2026-10-05): Maven clean verify
    on JDK 23.0.2 passes all 106 tests with PostgreSQL Testcontainers.
    Offset timestamps return UTC Z; malformed, offset-free and future timestamps
    remain rejected. No replacement custom deserializer is introduced.
    git diff --check passes.

  - Follow-up: remove custom problem type URNs from ApiExceptionHandler.
    Return standard ProblemDetail for missing Stones and preserve framework
    ProblemDetail types for other HTTP errors.
  - Standard ProblemDetail verification (2026-10-05): Maven verify on JDK 23.0.2
    passes all 106 tests with PostgreSQL Testcontainers. The default about:blank
    type is omitted by standard serialization; error tests follow this contract
    and still verify status, title, detail and application/problem+json.
    git diff --check passes.

  - Follow-up: relocate entity-target mappers to mappers.entities and DTO-target
    mappers to mappers.dtos. Update imports, entity accessors and architectural
    entity-access and mapper-placement checks. HTTP behavior is unchanged.
  - Mapper package verification (2026-10-05): Maven clean verify on JDK 23.0.2
    passes all 108 tests (94 catalog, 13 architecture, 1 bootstrap) with
    PostgreSQL Testcontainers. Package paths and git diff --check pass.

  - Follow-up: rename toResponse to toDto in all mappers.dtos classes and
    update their service calls and method references. Behavior is unchanged.
  - toDto rename verification (2026-10-05): Maven verify on JDK 23.0.2
    passes all 108 tests with PostgreSQL Testcontainers. No toResponse references
    remain in backend sources; git diff --check passes.

  - Follow-up: convert records with more than four fields to classes with
    getters/setters. Update DTO mappers to populate targets through setters,
    entity mappers to read request getters and search criteria usages.
    Preserve HTTP schemas and validation; enforce the record size rule in ArchUnit.
  - Large record conversion verification (2026-10-05): Maven clean verify on
    JDK 23.0.2 passes all 109 tests (94 catalog, 14 architecture, 1 bootstrap)
    with PostgreSQL Testcontainers. HTTP schemas, request validation and search
    behavior are preserved. Package paths and git diff --check pass.

  - Follow-up: introduce abstract entity/DTO mapper templates with final null
    checks, inject concrete mappers into StoneService and handle DTO mapper
    validation failures as standard HTTP 500 ProblemDetail. Verify all concrete
    mapper null paths, update non-mutation, error translation and existing API behavior.
  - Mapper null contract verification (2026-10-05): Maven clean verify on
    JDK 23.0.2 passes all 119 tests (94 catalog, 8 mapper null contracts,
    16 architecture, 1 bootstrap) with PostgreSQL Testcontainers. Null-source
    policies, update non-mutation, HTTP 500 translation and existing missing
    Stone HTTP 404 behavior pass. Package paths and git diff --check pass.

  - Follow-up: default catalog sorting to admissionDate DESC with id ASC ties.
    Keep explicit name/stoneSize sorting and its omitted ASC direction unchanged;
    respect a supplied direction for the default date field. Verify omitted/null
    sort values, differing dates, insertion/name independence and stable pages.
  - Admission date default sorting verification (2026-10-05): Maven verify on
    JDK 23.0.2 passes all 120 tests with PostgreSQL Testcontainers. The new API
    test covers AC-68–70: date order independent of name/insertion order, null
    defaults, ascending override and stable id ties across pages. Existing
    explicit name/size ordering remains green; git diff --check passes.

  - Follow-up: move search response construction and page item conversion into
    PageToStonesSearchResponseMapper; StoneService.search returns its ready DTO.
    Preserve search criteria/defaults, response schema and shared mapper null checks.
  - Search response mapper verification (2026-10-05): Maven verify on JDK 23.0.2
    passes all 120 tests with PostgreSQL Testcontainers. Existing empty-page,
    pagination, filtering and sorting tests verify unchanged search responses;
    mapper inheritance checks, package paths and git diff --check pass.

  - Follow-up: extract prepareSearchCriteria from StoneService.search and
    compute sort direction from the local selected field. Preserve search behavior.
  - Search criteria extraction verification (2026-10-05): Maven verify on
    JDK 23.0.2 passes all 120 tests with PostgreSQL Testcontainers, including
    default date ordering, explicit sorting, filters and pagination.
    git diff --check passes.

  - Follow-up: rename StoneSearch to StoneSearchCriteria and criteria variables
    in StoneService to stoneSearchCriteria; update repository types and references.
  - Search criteria rename verification (2026-10-05): Maven verify on JDK 23.0.2
    passes all 120 tests with PostgreSQL Testcontainers; git diff --check passes.

  - Follow-up: group production types by responsibility in services, enums,
    repositories, entities, criteria, exceptions, controllers and handlers.
    Update package declarations, imports, architecture rules and documentation;
    retain shared DTO and mapper packages and verify a clean backend build.
  - Package regrouping verification (2026-10-05): Maven clean verify on JDK
    23.0.2 passes all 124 tests (95 catalog, 8 mapper null contracts,
    20 architecture, 1 bootstrap) with PostgreSQL Testcontainers. Application
    component scanning, repository/entity discovery, package paths and
    git diff --check pass; no HTTP behavior changes.

  - Follow-up: document direct forwarding of single-use intermediate results
    and remove the page binding from StoneService.search.
  - Direct result forwarding verification (2026-10-05): Maven verify on
    JDK 23.0.2 passes all 124 tests with PostgreSQL Testcontainers;
    git diff --check passes.

  - Follow-up: remove remaining single-use forwarding bindings in StoneService
    create/search and the single-use descending value; preserve mutable/reused locals.
  - Service direct forwarding verification (2026-10-05): Maven verify on
    JDK 23.0.2 passes all 124 tests with PostgreSQL Testcontainers;
    git diff --check passes.

  - Follow-up: consume replace's return value in StoneService.update; make
    populateEntity return the resulting entity and forward it from the abstract
    mapper methods. Preserve shared null handling and managed entity updates.
  - Mapper update result verification (2026-10-05): Maven verify on JDK 23.0.2
    passes all 124 tests with PostgreSQL Testcontainers, including update API
    behavior and mapper null contracts. git diff --check passes.

  - Follow-up: rename AbstractEntityMapper.replace(entity, source) to
    toEntity(entity, source); update service calls and mapper contract tests.
    Preserve both overloads and their existing null policies.
  - toEntity overload rename verification (2026-10-05): Maven verify on
    JDK 23.0.2 passes all 124 tests with PostgreSQL Testcontainers;
    git diff --check passes.

  - Follow-up: document descriptive service method naming and rename the
    require lookup helper to findById, preserving not-found error handling.
  - Service lookup naming verification (2026-10-05): Maven verify on
    JDK 23.0.2 passes all 124 tests with PostgreSQL Testcontainers, including
    missing-resource HTTP 404 checks; git diff --check passes.
