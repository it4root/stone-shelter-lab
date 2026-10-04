# 001 — Implementation plan

## Scope

## Layers touched

|---|---|---|
| api | `StoneController`, dedicated request/response DTOs, `ApiExceptionHandler` | map API models at the boundary and delegate to the service |
| domain |  `StoneType`, `StoneSize`, `AdoptionStatus`, `StoneService` |  no JPA imports |
| persistence | `StoneEntity`, `StoneJpaRepository`, `StoneEntityToDtoMapper` | domain ↔ entity mapping here only |

## Search API DTOs

Use separate request and response DTOs at the controller boundary:

```java
public record StonesSearchRequest(
    StoneSearchFilter filter,
    Integer page,
    Integer size,
    SearchSort sort
) {}

public record StonesSearchResponse(
    List<StoneSearchResponse> items,
    int page,
    int size,
    long totalElements
) {}
```

Each catalog item uses a dedicated response DTO:

```java
public record StoneSearchResponse(
    Long id,
    String name,
    String photo,
    StoneType stoneType,
    String biography,
    AdoptionStatus adoptionStatus,
    Instant admissionDate,
    StoneSize stoneSize
) {}
```

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
of scope. Map request DTOs to application/domain models at the API boundary;
do not pass these API DTOs directly into the domain layer. Return catalog
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
Use `sort.field` with values name or stoneSize (default name), and `sort.direction`
with values asc or desc (default asc). The request contains one sort object,
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
| stone_type            | VARCHAR(32)   | NOT NULL, CHECK in allowed values |
| size            | VARCHAR(16)   | NOT NULL, CHECK in allowed values |
| adoption_status | VARCHAR(16)   | NOT NULL, CHECK in allowed values |
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
- The client supplies an RFC3339 timestamp with an explicit offset, including
  UTC `Z`. Responses normalize the timestamp to UTC `Z`.
- Validate against the current instant: `admissionDate` must not be in the future.
  A later time on the same calendar day is also invalid. Reject future values
  with HTTP 400 and `application/problem+json` on both POST and PUT.
- Reject malformed timestamps or timestamps without an explicit offset with
  HTTP 400 and `application/problem+json`.

## Photo normalization

Normalize an empty string (`photo: ""`) to `null` on both POST and PUT.
Persist and return `null` rather than an empty string. Photo is a placeholder
for future functionality. For now, accept an optional string of at most 500
characters; do not add URL validation or whitespace trimming.

## Size sort order:
SMALL < MEDIUM < LARGE
Both ascending and descending sorting must use this semantic order rather than
lexicographical string ordering.
Default sort: name ASC

## Controller method signatures

The following interface documents the proposed methods only; no controller or
service implementation is introduced by T0003-002.


```