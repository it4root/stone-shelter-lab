# 001 — Implementation plan

## Scope

## Layers touched

|---|---|---|
| controllers / handlers | `StoneCatalogController`, `ApiExceptionHandler` | bind and validate HTTP requests, delegate original Request DTOs to the service and return ready Response DTOs |
| services / enums |  `StoneType`, `StoneSize`, `AdoptionStatus`, `StoneService` |  services may work with entities; domain models remain independent of JPA |
| entities / repositories | `StoneEntity`, `StoneEntityRepository` | entity storage and database queries |
| mappers.entities / mappers.dtos | dedicated source-to-target mappers | entity and DTO conversion invoked by services |

## Shared DTOs

All request/response DTOs and nested types live in `lab.stoneshelter.shared`,
alongside services. Controllers and services share these types;
services have no dependency on the controllers/handlers packages. HTTP contracts are unchanged.

Use separate request and response DTOs at the controller boundary:

```java
public record StonesSearchRequest(
    StoneSearchFilter filter,
    Integer page,
    Integer size,
    SearchSort sort
) {}

public record StonesSearchResponse(
    List<StoneSearchResponse> content,
    int page,
    int size,
    long totalElements
) {}
```

Each catalog item uses a dedicated StoneSearchResponse class with id, name,
photo, stoneType, biography, adoptionStatus, admissionDate and stoneSize fields,
a no-argument constructor and public getters/setters. DTOs and domain criteria
with more than four fields are classes; records are limited to four fields.
Mappers use source getters and target setters for class-based types.
HTTP fields and validation constraints remain unchanged.

Nested request objects:

```java
public record StoneSearchFilter(
    StoneType stoneType,
    StoneSize stoneSize,
    AdoptionStatus adoptionStatus
) {}

public record SearchSort(
    String field,
    String direction
) {}
```

`searchTerm` is excluded from the current request because text search is out
of scope. Pass original request DTOs to the application service, which performs
business validation when needed, normalization and mapping. Application services
intentionally depend on shared DTOs; domain models remain independent of them. Return catalog
results inside `StonesSearchResponse`, not a framework pagination type.
These declarations describe DTO structure; validation and defaults must follow
the agreed feature requirements.

## Search request example
{
"filter": {
"stoneType": "GRANITE",
"stoneSize": "SMALL",
"adoptionStatus": "AVAILABLE"
},
"page": 0,
"size": 12,
"sort": {
"field": "name",
"direction": "asc"
}
}





filter contains field that should be mapped to real field with chek in additional service

## Decisions made here (not in the spec)

filter contains field that should be mapped to real field with chek in additional service

**Sort whitelist.** Map `sort.field` and `sort.direction` to a closed set of `Sort` objects, not to
a dynamically built `Sort.by(string)`. Unknown field or direction → 400, not 500.
AC-34 depends on the field whitelist. Allow one sort criterion only; reject
multiple criteria with 400 (AC-35).
Use explicit `sort.field` values name or stoneSize. Omitted/null sort.field
uses admissionDate. Omitted direction defaults to desc for admissionDate and asc
for explicitly selected name or stoneSize; supplied asc/desc is respected. The request contains one sort object,
not an array of sorting criteria. Always use `id ASC`
as the tiebreaker, including when the selected direction is DESC.
Sort names using PostgreSQL's ordinary ordering under the database collation.
Do not apply `lower(name)` or other case normalization. For equal values,
retain `id ASC` as the tiebreaker. No additional mixed-case ordering is defined.

**PUT is full replacement.** Absent `biography` means null (AC-39). Do not implement
merge or partial-update semantics.

**Search request binding.** Use POST `/api/v1/stones/search` with a JSON
`StonesSearchRequest` body and `@Valid @RequestBody`. This replaces list GET
and the previous deepObject query binding. Initialize defaults for page, size,
sort.field and sort.direction when omitted. Map the API request to a domain
search model before calling the service. Map pagination to Spring Data
`Pageable` internally and return a dedicated `StonesSearchResponse`.

**Filtering.** Combine the three optional filters from `StoneSearchFilter` into
one JPA `Specification`, each contributing a predicate only when non-null.
Do not build query strings.


## Database
Liquibase changelogs are the source of truth for the physical database schema.
Enum values persisted in the database must use their stable string names, not ordinals.


### Stone
| Column          | Type          | Constraints |
|-----------------|---------------|---|
| id              | BIGINT        | PK, identity |
| name            | VARCHAR(120)  | NOT NULL |
| stone_type            | VARCHAR(32)   | NOT NULL |
| size            | VARCHAR(16)   | NOT NULL |
| adoption_status | VARCHAR(16)   | NOT NULL |
| admission_date    | TIMESTAMP WITH TIME ZONE          | NOT NULL |
| biography       | VARCHAR(2048) | NULL |
| photo_url       | VARCHAR(500)  | NULL |

## Migration
New changeset `0003-create-stone-table.xml`:
- add constraints
- add only indexes justified by the current catalog queries
## Seed data
`0003-stone-catalog-seed.xml`, Liquibase context `dev`.
50 Stones covering every supported Stone type, all sizes and all adoption statuses.
Enable the seed only when the Spring `dev` profile is explicitly activated.
Configure Liquibase execution so the seed does not run outside that profile.
Apply the seed once per database using changeset tracking; restarting the
application must not insert duplicates.

## Timezone

- Model `admissionDate` as `Instant` and persist it as `TIMESTAMP WITH TIME ZONE`.
- Use standard Jackson timestamp-to-Instant conversion and UTC `Z` serialization.
  Do not register a global custom Instant deserializer for admissionDate.
- The client supplies an RFC3339 timestamp with an explicit offset, including
  UTC `Z`. Responses normalize the timestamp to UTC `Z`.
- Validate against the current instant: `admissionDate` must not be in the future.
  A later time on the same calendar day is also invalid. Reject future values
  with HTTP 400 and `application/problem+json` on both POST and PUT.
- Reject malformed timestamps or timestamps without an explicit offset with
  HTTP 400 and `application/problem+json`.

## Photo handling

Photo is an optional placeholder. Preserve its value unchanged on POST and PUT,
including null, empty strings and whitespace. Omitted photo maps to null.
Do not normalize, trim, validate URLs or otherwise process photo values.

## Size sort order:
SMALL < MEDIUM < LARGE
Both ascending and descending sorting must use this semantic order rather than
lexicographical string ordering.
Default sort: admissionDate DESC, id ASC

## Controller method signatures

The following interface documents the proposed methods only; no controller or
service implementation is introduced by T0003-002.


```
## T0003-004 boundary

Implement CRUD and search end-to-end, including controller delegation and errors.
Preserve the approved controller signatures and DTO contracts. Development seed
and its lifecycle checks (AC-65–67) are deferred to a separate task.

## Service and repository responsibilities

Repositories accept and return entities and execute database queries. Services
accept original controller Request DTOs, perform additional business validation
when needed, apply changes, normalize values and invoke request/entity/response
mappers. Services return ready Response DTOs. Controllers contain no business
logic or mapping and do not instantiate domain models or persistence entities. Entity classes
live in entities; entity-target mappers live in mappers.entities and
DTO-target mappers live in mappers.dtos; entities do not cross the service-to-API
boundary. Repositories construct JPA predicates, database ordering and pagination from
the domain search criteria; services do not depend on JPA query APIs.

Use one StoneEntityRepository extending JpaRepository and JpaSpecificationExecutor.
Execute filtered, ordered queries with a separate filter-only count specification.
Use an unsorted Pageable so it does not override Criteria ordering, including
semantic size order and the id ASC tiebreaker. Handle offsets beyond the JPA
integer limit as empty pages with the filtered total.

## Typed sort field

Keep sort.field as a validated string in the approved API DTO. Inside the
service map it to domain StoneSortField: NAME("name") or
STONE_SIZE("stoneSize"). Use internal ADMISSION_DATE("admissionDate") when
the field is omitted; keep the explicit API field whitelist unchanged. StoneSearchCriteria carries
the enum through the service to persistence; query ordering uses an exhaustive
enum switch. Unknown API values remain HTTP 400.

## Enum validation ownership

Validate supported Stone types, sizes and adoption statuses on the server.
Do not add database CHECK constraints enumerating those business values.
Persist enum names as strings; retain schema type, length, NOT NULL and PK
constraints. This decision does not add new enum values or change the API.

## Direct controller responses

Controller methods return dedicated Response DTOs directly. ResponseEntity is
used only when explicitly requested in a task. Stone creation uses
@ResponseStatus(HttpStatus.CREATED), returns StoneCreateResponse and does not
emit a Location header. HTTP 201 and the response body remain unchanged.

## Standard problem details

Use standard Spring ProblemDetail types without custom URNs. Missing Stones
return ProblemDetail.forStatusAndDetail with HTTP 404 and the exception detail.
Framework errors retain their standard ProblemDetail type.
The standard about:blank type may be omitted from JSON; an omitted type has
the same meaning. Acceptance checks must not require an explicit type field
for these generic HTTP problems.

## Mapper packages

Put entity-target mappers in lab.stoneshelter.mappers.entities and DTO-target
mappers in lab.stoneshelter.mappers.dtos. Keep full source-to-target mapper names,
including existing ResponseMapper names for DTO targets. Entity access uses
public constructors and accessors; no business logic moves into mappers.

DTO-target mappers in mappers.dtos expose the conversion method as toDto.
Services use toDto for both direct calls and search-result method references.

## Mapper null contracts

Entity-target mappers extend AbstractEntityMapper. Its final toEntity and replace
methods return null for a null source, without creating or changing an entity.
Replacing a non-null request requires a non-null target entity.
DTO-target mappers extend AbstractDtoMapper. Its final toDto validates the source
before conversion: null raises MapperValidationException, handled as HTTP 500
with standard ProblemDetail. This is a technical source check, not business or
Bean Validation. Missing Stones still return 404 in StoneService.require.
Concrete mappers are Spring components injected into StoneService; conversion
hooks use getters and setters. No field-level validation is added.

## Response assembly

Services obtain all ready Response DTOs through dedicated source-to-target
mappers. Do not instantiate or populate response objects in services, including
StonesSearchResponse pagination wrappers and StoneDeleteResponse identifier
responses. Pagination mappers own content conversion and page metadata mapping;
services delegate response assembly to the mapper. Class targets use getters
and setters; record targets with at most four fields may use constructors inside
mappers. HTTP schemas and business behavior remain unchanged.

Search response assembly uses PageToStonesSearchResponseMapper in mappers.dtos,
extending AbstractDtoMapper<Page<StoneEntity>, StonesSearchResponse>. It maps
content through StoneEntityToStoneSearchResponseMapper and copies page metadata.
StoneService.search delegates the repository page directly to this mapper.

StoneService.search delegates criteria preparation to a private
prepareSearchCriteria method. Compute the selected field and direction in local
variables before populating StoneSearchCriteria; preserve all current defaults and filters.

## Packages by responsibility

Use lab.stoneshelter.services for StoneService, enums for domain enums,
repositories for StoneEntityRepository, entities for StoneEntity, criteria for
StoneSearchCriteria, exceptions for application/mapper exceptions, controllers
for StoneCatalogController and handlers for ApiExceptionHandler. Keep DTOs in
shared and mappers in mappers.entities / mappers.dtos. The application bootstrap
remains in lab.stoneshelter. Preserve service/repository/mapper boundaries and
HTTP behavior; update ArchUnit package restrictions to the new layout.
