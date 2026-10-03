# Backend conventions

Read the root AGENTS.md, constitution, current feature spec, tasks and ADR first.
Use the pinned ADR-0001 versions, including JDK 23.0.2 (Java release 23).
Do not change versions silently.

- Packages: lab.stoneshelter.api, domain, persistence, config.
- Controllers live in api, services in domain, repositories/entities in persistence.
- Controllers call services; only services call repositories. Entities stay in persistence.
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
