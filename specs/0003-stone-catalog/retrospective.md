# Stone Catalog — iteration retrospective

Date: 2026-10-05
Implementation baseline: `b760f3f` — `feat: implement Stone Catalog backend (T0003-004)`.
This retrospective was written after that commit and describes the implementation
and development rules agreed during the iteration.

## Code improvements

| Area | Change | Result |
|---|---|---|
| Controllers | Removed manual request conversion, response construction and search defaults from StoneCatalogController. | HTTP methods delegate original Request DTOs to services and return ready Response DTOs. |
| Creation responses | Replaced ResponseEntity and Location construction with StoneCreateResponse and @ResponseStatus(HttpStatus.CREATED). | Creation returns HTTP 201 with a simpler controller method; Location is no longer emitted. |
| Shared DTOs | Moved request/response types and nested search types into shared. | Services use the same contracts as controllers without depending on controller packages. |
| DTO representation | Converted six DTOs and the search criteria type from records into classes with accessors. | Types with more than four fields follow the agreed class convention; validation annotations remain on request fields. |
| Mapping | Introduced dedicated source-to-target mappers and separated mappers.entities from mappers.dtos. | Conversion is explicit; source getters and target setters replace long constructor argument lists for class targets. |
| Mapper null handling | Added AbstractEntityMapper and AbstractDtoMapper with final conversion methods; concrete mappers became injected Spring components. | Entity-target mapping returns null for null input; DTO-target mapping raises MapperValidationException and produces HTTP 500 ProblemDetail. |
| Search response assembly | Added PageToStonesSearchResponseMapper. | Page content conversion and pagination metadata assembly happen in a mapper rather than StoneService.search. |
| Search preparation | Extracted prepareSearchCriteria and renamed StoneSearch to StoneSearchCriteria. | The service method reads as prepare criteria, query repository, map response; sort direction is computed from a local field value. |
| Default ordering | Changed the default to admissionDate DESC with id ASC ties. | Later admission dates appear first, with stable pagination when dates match. Explicit name/size sorting remains available. |
| Persistence | Kept filtering, Criteria predicates, database sorting and pagination in StoneEntityRepository. | Services express query intent without depending on JPA query APIs; repositories work with entities and criteria. |
| Photo handling | Removed photo normalization and accessors used exclusively for it. | Null, empty strings and whitespace are preserved unchanged. The existing optional-field length limit remains. |
| Timestamp handling | Removed AdmissionDateJsonConfiguration and its global Instant deserializer. | Standard Jackson conversion accepts offset timestamps and emits UTC Z without changing Instant deserialization throughout the application. |
| Error handling | Removed custom problem type URNs. | Errors use standard ProblemDetail; the default about:blank type may be omitted from JSON. |
| Package organization | Replaced broad api/domain/persistence packages with packages by responsibility. | Controllers, handlers, services, enums, repositories, entities, criteria and exceptions have explicit locations; shared and mapper packages retain their roles. |

## New or clarified development rules

1. Controllers own HTTP binding, @Valid, statuses and explicitly requested headers.
   They contain no business logic, normalization, search criteria preparation or
   request/entity/response mapping. They do not construct domain models or entities.
2. Services accept original shared Request DTOs and return ready Response DTOs.
   This DTO dependency is intentional. Services remain independent of controllers
   and handlers; criteria, enums and entities remain independent of shared DTOs.
3. Response DTOs are returned directly from controller methods. Use ResponseEntity
   only when explicitly requested in the task. Creation methods use
   @ResponseStatus(HttpStatus.CREATED); add Location only when explicitly requested.
4. Use records only for types with at most four fields. Larger types are classes
   with private fields, a no-argument constructor and public getters/setters.
5. Name mappers `{FullSourceTypeName}To{FullTargetTypeName}Mapper`. Entity-target
   mappers belong in mappers.entities; DTO-target mappers belong in mappers.dtos.
   DTO conversion methods are named toDto.
6. Class-target mappers construct targets with a no-argument constructor and
   populate them through setters, reading source classes through getters.
   Constructors for small record targets are allowed inside mappers.
7. Services obtain object and collection/page Response DTOs through mappers.
   Scalar-to-response construction is exempt: delete(long id) may construct
   StoneDeleteResponse directly from the id. Other response assembly belongs
   inside mappers.
8. Entity-target mappers inherit the null-source policy from AbstractEntityMapper.
   Null input returns null and does not modify an existing target. DTO-target
   mappers inherit technical source validation from AbstractDtoMapper; null input
   raises MapperValidationException. Business validation stays in services.
9. Missing resources are handled in the service as HTTP 404. A null source passed
   to a DTO mapper is an internal mapping contract failure, handled as HTTP 500.
   These cases must not be conflated.
10. Repositories accept entities and application/domain criteria, not Request DTOs.
    They own JPA filtering, ordering and pagination. Services must not depend on
    Specification, CriteriaBuilder, Predicate or EntityManager. Repositories do
    not invoke mappers.
11. Services own changes and specification-required normalization. Do not repeat
    constraints already enforced by Bean Validation or process placeholder fields
    without a requirement.
12. Put @Transactional on service classes and annotate read operations with
    @Transactional(readOnly = true); do not repeat the default on write methods.
13. Group types by responsibility and preserve layer boundaries when moving files.
    Update package declarations, imports, architecture checks and documentation
    together; confirm package paths and application discovery with a clean build.
14. Use explicit imports, including in tests. Wildcard imports are prohibited.

The main architectural rules are recorded in the constitution and AGENTS files.
Concrete mapper and variable naming conventions have also been added to the
constitution and AGENTS files following the completeness audit below. Photo behavior, timestamp behavior and default ordering are
feature decisions rather than universal rules for every future feature.

## Lessons and verification

Architectural changes must be reflected in the specification and technical plan
before implementation. Acceptance checks must follow an explicitly changed
contract, rather than being weakened to accommodate an accidental implementation.
The Location removal, unchanged photo values and default date ordering were
intentional behavior changes; ordinary refactoring preserved other HTTP behavior.

Prefer existing framework behavior when it satisfies the specification. The
custom global Instant deserializer and custom generic problem URNs added scope
without providing a required capability. Abstract mapper templates were added
only after their distinct null policies became explicit requirements.

The final clean Maven verification on JDK 23.0.2 passed 124 tests: 95 catalog API,
8 mapper null contracts, 20 architecture and 1 bootstrap test, using PostgreSQL
Testcontainers. It checked application startup, entity/repository discovery,
validation, CRUD, filtering, sorting, pagination, mapper null handling and error
translation. Java package paths and git diff --check also passed. Development
seed acceptance criteria AC-65–67 remain outside this task.

The direct commons-lang3 dependency remains, although photo normalization no
longer uses StringUtils. StoneService.delete constructs StoneDeleteResponse
from the scalar id; this is permitted by the subsequently agreed scalar-response
exception and is no longer an implementation gap.

## Follow-up decisions after the implementation commit

The following refinements were made after b760f3f. They extend the earlier
retrospective without changing the historical implementation baseline.

| Decision | Implementation and rationale |
|---|---|
| Forward single-use results directly | StoneService.create passes the request mapper result directly to repository.save. search passes prepared criteria directly to repository.search and its result to the response mapper. The direction expression is passed directly to setDescending. Keep locals needed for population, reuse or intermediate computation. A local binding itself does not allocate another object. |
| Consume object transformation results | update no longer ignores the entity mapper result. It passes that result directly to the response mapper, so a null mapping result is not silently replaced by the original entity reference. |
| Return results from mapping hooks | populateEntity returns StoneEntity, and AbstractEntityMapper forwards it. This makes the result contract explicit for both public conversion methods and protected hooks. The managed entity is still updated in place; returning it does not make mapping immutable. Conventional setters retain their existing contract. |
| Unify entity conversion names | Renamed replace(entity, source) to toEntity(entity, source). Creation uses toEntity(source); updating uses the entity-first overload. Both retain the shared null-source checks. |
| Use descriptive lookup names | Renamed the service lookup helper require to findById, matching repository.findById. The service still translates Optional.empty to StoneNotFoundException and HTTP 404. A matching name does not require a matching return type. |
| Clarify default sort responsibility | The service selects ADMISSION_DATE and descending when sorting is omitted. The repository maps that field to admissionDate and applies DESC, then id ASC. The orderBy expression applies prepared criteria; it does not choose the default field. |

## Completeness audit of development rules

| Agreed convention | Where it is recorded | Assessment |
|---|---|---|
| Thin controllers; original Request DTOs and ready Response DTOs | Constitution 9 and 11; root/backend AGENTS | Recorded as a development rule. |
| Direct Response DTO returns, explicit ResponseEntity request, creation status annotation | Constitution 13; root/backend AGENTS | Recorded as a development rule. |
| Shared DTO ownership and repository criteria boundary | Constitution 11 and 16; root/backend AGENTS | Recorded as a development rule. |
| Full source-to-target mapper names and entity/DTO mapper packages | Constitution 15; root/backend AGENTS | Recorded as a development rule. |
| Response assembly only in mappers, including pagination and identifier responses | Constitution 15; root/backend AGENTS | Recorded as a rule with a scalar-response exception; delete(long id) is compliant. |
| Shared entity/DTO mapper null policies and technical versus business validation | Constitution 15; root/backend AGENTS | Recorded as a development rule. |
| Classes for more than four fields; getter/setter mapping | Constitution 18; root/backend AGENTS | Recorded as a development rule. |
| Avoid single-use forwarding variables | Constitution 19; root/backend AGENTS | Recorded as a development rule. |
| Transformation methods return results and callers consume them | Constitution 20; root/backend AGENTS | Recorded as a development rule. |
| Service names match repository operations or use a descriptive verb | Constitution 21; root/backend AGENTS | Recorded as a development rule. |
| Packages grouped by responsibility | Constitution Package structure; root/backend AGENTS | Recorded as a development rule. |
| Explicit imports, service transaction defaults, no JPA queries in services | Constitution 14, 17 and 16; backend AGENTS | Recorded as development rules. |
| DTO conversion method named toDto | Constitution 15; root/backend AGENTS; feature plan | Now explicitly recorded in constitution 15 and both AGENTS files. |
| Entity conversion methods named toEntity, including the entity-first update overload | Constitution 15; root/backend AGENTS; feature plan | Now explicitly recorded in constitution 15 and both AGENTS files. |
| Criteria variable named stoneSearchCriteria after StoneSearchCriteria | Constitution 22; root/backend AGENTS; current implementation | Now recorded as a general descriptive type-derived naming convention in constitution 22 and both AGENTS files. |

The previously missing general conventions have now been added to the
constitution and both AGENTS files: toDto/toEntity method naming, entity-first
update overload order and descriptive lowerCamelCase object variable names
based on their types. Single-use forwarding results still need no local variable.

A scalar input does not itself require a mapper. The response-assembly exception
permits identifier-only responses constructed directly from an id, such as
StoneService.delete. A method receiving an id but loading an entity still uses
an entity-to-DTO mapper for that entity; scalar input does not exempt object
conversion or collection/page response assembly.

Photo preservation, admissionDate DESC with id ASC ties, standard timestamp
conversion and removal of custom generic problem URNs are recorded in the feature
specification, plan and/or ADR. They are covered as feature decisions; they do
not automatically establish universal defaults for unrelated resources. The
constitution requires RFC 9457 ProblemDetail, but does not separately prohibit
custom types for future errors that genuinely need distinct semantics.

Avoiding field-specific global Instant deserializers and preferring standard
framework behavior are documented lessons and feature decisions. If they are
intended as mandatory rules across the whole project, they still need an explicit
statement in the constitution and AGENTS files.

The recent implementation checks continued to pass all 124 backend tests on
JDK 23.0.2 with PostgreSQL Testcontainers. This completeness audit changes only
documentation; git diff --check was run and no new implementation was introduced.

The scalar-response exception and the naming rules above were added as explicit
user decisions after the completeness audit. This update changes documentation
only; the existing delete implementation is retained and no mapper is added.
