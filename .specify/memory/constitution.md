# Constitution — rules that are not up for debate

## Technical
1. Versions are pinned in `../../docs/adr/0001-stack-versions.md`. `pom.xml`,
   `package.json`, `docker-compose.yml` carry concrete versions only.
2. The database schema is managed by Liquibase only. `ddl-auto=validate`.
   A committed changeset file is NEVER edited — only new ones are added.
3. Secrets and addresses reach the app through environment variables only.
   The repository holds `.env.example`. `.env` is in `.gitignore`.
4. Any test that needs a database uses Testcontainers. H2 is banned.
5. API errors use RFC 9457 `ProblemDetail`. A hand-rolled `{error: "..."}` is banned.
6. Paging uses Spring Data `Pageable` only. Response body is strictly:
   `content`, `page`, `size`, `totalElements`.
7. Sorting is restricted to a field whitelist. An unknown field returns 400, not 500.
8. Layers: `controller` -> `service` -> `repository`. Controllers never touch repositories.
9. Controllers handle HTTP routing, request binding, Bean Validation (`@Valid`),
   response statuses and explicitly required headers. They pass the original
   Request DTO to the service and receive a ready Response DTO; controllers
   do not contain business logic, instantiate domain models or persistence
   entities, normalize data, construct search criteria or map DTOs and entities.
   Services perform additional business validation when needed, apply changes
   and normalization, and invoke Request-to-Entity and Entity-to-Response mappers.
   Do not duplicate request constraints already checked by Bean Validation.
   Services may work with persistence entities internally, but entities never
   reach controllers or HTTP responses. Repositories accept and return entities
   and execute database queries; they do not normalize data or invoke mappers.
10. Every rule above that a test can express must exist as an ArchUnit test.
11. Each structured controller request and response is represented by a separate
    DTO with the suffix `Request` or `Response`, respectively. For resource
    operations, the DTO name identifies the action and resource. Collections are
    returned inside a response object. 
    StoneCreateRequest
    StoneUpdateRequest
    StoneResponse
    StonesSearchRequest
    StonesSearchResponse
    Collection responses must be wrapped in a dedicated response DTO rather than returning framework collection or pagination types directly.
    Application services accept the controller Request DTO and return the
    dedicated Response DTO. Shared request/response DTOs and their nested types
    live in `lab.stoneshelter.shared`, alongside services,
    outside controllers and handlers. Services and controllers depend on these
    shared DTOs; services must not depend on controllers or handlers. Domain models
    remain independent of shared DTOs. Repositories must not accept Request
    DTOs or return Response DTOs.
    Operations with no request or response body do not require empty DTOs.
    A successful DELETE resource deletion operations covered by this convention must return HTTP 200 with a dedicated response DTO
    containing the deleted item's identifier under the `id` key, for example
    `StoneDeleteResponse` with body `{"id": 7}`. This allows the UI to identify
    the removed item. DELETE must not return HTTP 204 for these operations.
    Do not reuse a single DTO across request and response boundaries solely to reduce duplication.
    Prefer explicit API contracts over inheritance or composition tricks between request and response DTOs unless such reuse is explicitly justified and approved.


12. Name each controller after the domain entity or domain concept it represents,
    followed by the suffix `Controller`, for example `StoneCatalogController`.
13. Controller methods return their dedicated Response DTO directly by default.
    Use `ResponseEntity` only when explicitly requested in the task.
    Creation methods use `@ResponseStatus(HttpStatus.CREATED)` and return 201
    with their dedicated creation Response DTO. Do not add a `Location` header
    unless explicitly required by the task.
    Read, search and full-replacement update return 200 with their respective
    response DTOs. Common errors use ProblemDetail.
14. Use explicit Java imports for each referenced type or static member.
    Wildcard imports (`import ...*` and `import static ...*`) are prohibited,
    including in tests.
15. Name mappers `{FullSourceTypeName}To{FullTargetTypeName}Mapper`, for example
    `StoneCreateRequestToStoneEntityMapper` and
    `StoneEntityToStoneCreateResponseMapper`. Mappers perform conversion;
    services own business validation and normalization.
    Services must obtain ready Response DTOs through mappers rather than
    constructing or populating them directly. This includes collection and
    pagination wrappers and identifier-only responses. Constructors, setters
    and collection item conversion used to build responses belong inside
    mappers. Class-based DTO targets use no-argument constructors and setters;
    records with at most four fields may use their constructors inside mappers.
    Put mappers targeting entities (including names ending in EntityMapper) in
    `lab.stoneshelter.mappers.entities`. Put mappers targeting DTOs (including
    names ending in DtoMapper or ResponseMapper) in `lab.stoneshelter.mappers.dtos`.
    Entity mappers and DTO mappers may access persistence entities; controllers
    must not depend on either mapper package.
    Entity-target mappers extend AbstractEntityMapper: null source returns null.
    DTO-target mappers extend AbstractDtoMapper: null source raises
    MapperValidationException, translated to standard HTTP 500 ProblemDetail.
    Shared mapper validation checks technical inputs only; business validation
    stays in services. Missing resources remain service-level HTTP 404 errors.
16. Services must not depend on JPA query abstractions such as Specification,
    CriteriaBuilder, Predicate or EntityManager. They express query intent using
    application/domain criteria objects. Repositories build JPA predicates,
    filtering, database ordering and pagination queries. Services may use entity
    types for changes and mapping as described in rule 9.

17. Put `@Transactional` on service classes to make read-write transactions the
    default. Annotate only read operations with `@Transactional(readOnly = true)`.
    Do not repeat the default transaction annotation on write methods.

18. Use records only for types with at most four fields. Types with more than four
    fields must be classes with private fields, a no-argument constructor and public
    getters/setters. Mappers create class targets with the no-argument constructor
    and populate them using setters, reading source classes through getters.

## Process
1. Spec → plan → tasks → code. No spec, no code.
2. Infrastructure in `docker-compose.yml` may be running without being used.
   A service in compose is NOT permission to write code for it.
3. One commit = one task.

## Language
1. Every artifact in this repository is written in English: docs, ADRs, specs,
   glossaries, code comments, Javadoc, commit messages, branch names, identifiers,
   test names and OpenAPI descriptions. This holds regardless of the language
   used in conversation with the agent.

## Package structure

Group types by responsibility under lab.stoneshelter: controllers, handlers,
services, enums, repositories, entities, criteria and exceptions. DTOs live in
shared; mappers live in mappers.entities / mappers.dtos. The application bootstrap
stays in the root package. Services do not depend on controllers or handlers;
criteria, enums and entities do not depend on shared DTOs.
