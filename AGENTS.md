# Stone Shelter

## Project goal

Educational project for practicing:
- spec-driven development
- AI-first development
- contract-first API design
- autonomous coding-agent workflows

## Mandatory workflow

For every feature:

1. Read the feature specification and its sibling `acceptance.md`.
2. Do not implement undocumented requirements.
3. Update specification before implementation if behavior changes.
4. Define or update HTTP contract requirements in the specification before implementation. The generated OpenAPI document is the source of truth; do not maintain a separate handwritten HTTP contract. Define or update AsyncAPI contracts before Kafka implementation.
5. Implement.
6. Run verification.
7. Check implementation against acceptance criteria.
8. Do not create commits unless explicitly requested
9. Do not push unless explicitly requested.

## Repository structure

| Path                                 | What lives there                       |
|--------------------------------------|----------------------------------------|
| `.specify/memory/constitution.md`    | Non-negotiable rules. Read this FIRST  |
| `specs/NNN-*/spec.md`                | Feature spec: what and why             |
| `specs/NNN-*/acceptance.md`          | Feature acceptance criteria            |
| `specs/NNN-*/plan.md`                | Technical decisions for the feature    |
| `specs/NNN-*/tasks.md`               | Task checklist for the feature         |
| Generated `/v3/api-docs` and `/v3/api-docs.yaml` | HTTP API contract source of truth |
| `docs/adr/NNNN-*.md`                 | Decisions and their rationale          |
| `docs/glossary.md`                   | Ubiquitous language for the domain     |
| `stone-shelter-api/`                 | Spring Boot backend                    |
| `stone-shelter-ui/`                  | React frontend                         |
| `compose.yml`                        | Infrastructure: postgres, minio, kafka |

## Feature workflow (mandatory)
1. Read `constitution.md` and the current feature spec.
2. If there is no spec — do NOT write code. Say so and stop.
3. Write code task by task from `tasks.md`. One task = one commit.
4. After each task: run tests, report back in one line.

## Rules

- Store acceptance criteria for every feature exclusively in its `specs/NNN-*/acceptance.md`. Link to that file from `spec.md`; do not duplicate criteria in `spec.md`, `plan.md` or `tasks.md`. Read and update `acceptance.md` alongside the specification before implementation when requirements change, and verify implementation against it.
- Generated OpenAPI is the source of truth for HTTP API contracts. Generate it from Spring MVC controllers and shared DTOs; do not maintain a separate handwritten OpenAPI contract.
- AsyncAPI is the source of truth for Kafka contracts.
- Database schema changes require Liquibase migrations.
- Never modify an already applied Liquibase migration.
- Do not introduce libraries without a reason.
- Do not implement speculative functionality.
- Prefer the smallest change satisfying the current spec.
- When asked to execute a specific task ID, execute only that task. Do not automatically continue with subsequent tasks.
- All artifacts are in English, including commit messages and comments, even when
  our conversation is in another language.
## Backend layer responsibilities

- Controllers own HTTP routes, binding, `@Valid`, statuses and headers. Pass the
  original Request DTO to the service and return its ready Response DTO.
  Controllers must not contain business logic, instantiate domain models or
  persistence entities, or perform request/response mapping.
- Services own additional business validation, changes and normalization, and
  invoke Request-to-Entity and Entity-to-Response mappers. Do not duplicate
  request constraints already enforced by Bean Validation.
- Repositories accept/return entities and execute queries. Build JPA
  specifications, Criteria predicates and database ordering in repositories.
- Services may use entities internally; controllers must never receive entities.
  Services must not depend on JPA query APIs. Domain models remain independent
  of shared DTOs, while application services intentionally use Request/Response DTOs.
  Shared DTOs and nested request/response types live in `lab.stoneshelter.shared`,
  alongside services, outside controllers and handlers. Services must not depend on controllers or handlers.
- Return Response DTOs directly from controllers. Use ResponseEntity only when
  explicitly requested in the task. Creation methods use
  @ResponseStatus(HttpStatus.CREATED). Add Location only when explicitly requested.
- Name mappers `{FullSourceTypeName}To{FullTargetTypeName}Mapper`.
  Entity-target mappers live in `lab.stoneshelter.mappers.entities`; DTO-target
  mappers live in `lab.stoneshelter.mappers.dtos`. Both may access entities.

## Current constraints
- Do not add a dependency when `pom.xml` / `package.json` already covers the need.
- Do not create a file until there is a real reason for it.
- Do not bend a test to fit the code. If a test is red, fix the code.
- All versions explicit. Never `latest`.
## Local rules
`stone-shelter-api/AGENTS.md` and `stone-shelter-ui/AGENTS.md` hold additions
specific to each side. They extend this file, they do not replace it.

## Task execution boundaries

When asked to execute a specific task, execute only that task.

After completing the requested task:
- stop;
- report what was done;
- report verification results;
- do not automatically continue with the next task.

Do not execute additional tasks from the task list unless the user explicitly asks to continue.

Examples:

- `Execute T003` → execute only T003, then stop.
- `Execute T003 and T004` → execute only T003 and T004, then stop.
- `Execute all remaining tasks` → tasks may be executed sequentially until the list is complete.
- `Continue` → execute the next logical task only, then stop again unless the user explicitly requests continuous execution.

Default behavior is **one requested task at a time**.

Never interpret the existence of subsequent tasks in `tasks.md` as permission to execute them.
- Use records only for types with at most four fields. Types with more than four
  fields must be classes with private fields, a no-argument constructor and public
  getters/setters. Mappers create class targets with the no-argument constructor
  and populate them using setters, reading source classes through getters.

- Entity-target mappers inherit null-source handling from AbstractEntityMapper
  (return null). DTO-target mappers inherit source validation from AbstractDtoMapper
  (throw MapperValidationException for null, translated to HTTP 500 ProblemDetail).
  Missing-resource 404 errors remain in services; mapper checks are technical only.

- Services obtain ready Response DTOs through mappers; do not construct or
  populate responses directly in services. This includes collection/pagination
  wrappers. Exception: simple scalar values such as an id do not require a mapper;
  delete(long id) may construct an identifier-only response directly. Mapping
  entities, structured request objects and collections still requires mappers.
  Assemble other response fields and map collection items inside mappers. Class targets use no-argument constructors
  and setters; record targets with at most four fields may use constructors
  inside mappers.

- Package types by responsibility: controllers, handlers, services, enums,
  repositories, entities, criteria and exceptions under lab.stoneshelter.
  Keep shared DTOs in shared and mappers in mappers.entities / mappers.dtos.

- Avoid temporary variables that only hold a value for a single immediate call
  and require no further processing. Pass the expression directly to that call,
  for example `return searchResponseMapper.toDto(repository.search(stoneSearchCriteria));`.
  Keep local variables when needed for mutation, reuse or intermediate computation.
  This rule concerns local bindings; assigning a method result to a variable does
  not itself create an additional object.

- Object transformation methods in application and mapper APIs must return the
  resulting object, including protected mapping hooks. Callers must use that result
  rather than ignore it and rely only on mutation of an input reference. Forward
  single-use results directly to the next method. Conventional field setters keep
  their existing setter contract; framework command APIs are not redefined.

- Service method names should match the corresponding repository method names
  where practical, or contain a verb that clearly describes the method's function.
  Name identifier lookup helpers findById rather than vague names such as require.
  A service findById helper may translate an empty repository Optional into the
  specified not-found exception; matching names does not require matching return types.

- Name DTO conversion methods toDto. Entity conversion methods are toEntity(source)
  for creation and toEntity(entity, source) for updates; preserve entity-first order
  in the update overload and use the returned result.
- Name local object variables descriptively after their type in lowerCamelCase,
  for example StoneSearchCriteria -> stoneSearchCriteria. Do not introduce a
  single-use forwarding variable solely to satisfy this naming convention.
