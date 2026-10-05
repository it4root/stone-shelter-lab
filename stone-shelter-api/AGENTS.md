# Backend conventions

Read the root AGENTS.md, constitution, current feature spec, tasks and ADR first.
Use the pinned ADR-0001 versions, including JDK 23.0.2 (Java release 23).
Do not change versions silently.

- Packages: lab.stoneshelter.controllers, handlers, services, enums, repositories, entities, criteria, exceptions, shared, mappers.entities, mappers.dtos.
- Controllers live in controllers, services in services, repositories in repositories and entities in entities. Criteria live in criteria; exceptions in exceptions; HTTP exception handlers in handlers.
- Controllers call services; only services call repositories. Entity classes live in entities.
- Controllers pass original Request DTOs to services and receive ready Response DTOs. Keep HTTP binding, @Valid, statuses and headers in controllers; move normalization, search defaults and mapper calls to services. Controllers must not contain business logic, instantiate domain models or persistence entities, or perform request/response mapping.
- Shared request/response DTOs and their nested types live in lab.stoneshelter.shared alongside services, outside controllers and handlers. Services and controllers depend on shared DTOs; domain models do not. Services must not depend on controllers or handlers. Repositories work with entities and domain criteria, never shared DTOs.
- Return Response DTOs directly from controllers. Use ResponseEntity only when
  explicitly requested in the task. Creation methods use
  @ResponseStatus(HttpStatus.CREATED). Add Location only when explicitly requested.
- Name mappers {FullSourceTypeName}To{FullTargetTypeName}Mapper, for example StoneCreateRequestToStoneEntityMapper and StoneEntityToStoneCreateResponseMapper.
- Repositories work with entities and queries; services perform changes and normalization and invoke mappers. Entities never reach controllers.
- Build JPA specifications, Criteria predicates and database ordering in repositories, not services.
- HTTP contracts come from OpenAPI; errors use RFC 9457 ProblemDetail.
- Liquibase owns schema changes. Never edit a committed changeset.
- Database configuration comes from environment variables; ddl-auto stays validate.
- Database tests use Testcontainers with PostgreSQL 18.6; never H2.
- Keep architecture rules in ArchUnit tests; do not add business behavior without a spec.
- Run ./mvnw verify when the assigned task includes backend build verification.
- Tests must verify application behavior or a unique technical guarantee.
- Do not add assertions that merely verify framework internals or repeat guarantees already provided by application context startup.
- Prefer framework-native testing facilities over custom infrastructure code.
- Every assertion should catch a meaningful failure that would otherwise remain undetected.
- Each test must explicitly create all data it requires.
- Each test must clean up all data it creates.
- Tests must not depend on data created by other tests.
- Tests must not depend on test execution order.
- Shared database infrastructure is allowed, but shared mutable test data is not.
- After implementation, verify that all created or modified source files are located under the correct module source roots and are included in the build.

- Put entity-target mappers in lab.stoneshelter.mappers.entities and DTO-target mappers in lab.stoneshelter.mappers.dtos. Keep full source-to-target mapper names. Both mapper packages may access entities; controllers must not depend on mappers.

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
  wrappers and identifier-only responses. Assemble response fields and map
  collection items inside mappers. Class targets use no-argument constructors
  and setters; record targets with at most four fields may use constructors
  inside mappers.

- Package types by responsibility: controllers, handlers, services, enums,
  repositories, entities, criteria and exceptions under lab.stoneshelter.
  Keep shared DTOs in shared and mappers in mappers.entities / mappers.dtos.
