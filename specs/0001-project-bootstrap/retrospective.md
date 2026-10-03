# Bootstrap retrospective

## Review findings

- The useful bootstrap check is application startup against real PostgreSQL
  followed by HTTP 200 and JSON status `UP` at `/actuator/health`. Startup alone
  does not prove the endpoint is exposed or reports healthy.
- Architecture rules enforce project boundaries that Spring does not enforce.
  Their current selections are empty; passing rules are not evidence of exercised
  boundaries or complete coverage of the constitution.
- Shared infrastructure does not isolate test data. One integration class gives
  no demonstrated speedup from sharing; matching Spring contexts can be cached.
- Remaining review recommendations were not implemented: simplify manual container
  lifecycle where context-level sharing suffices, remove the duplicate direct
  Liquibase dependency, and review configuration that repeats Boot defaults.
  JVM-wide versus context-wide lifecycle requires a specification decision first.

## Rejected approaches

- Counting Liquibase tracking rows: the first real changeset would break the test.
  Checking tracking-table existence instead still couples the test to internals
  and adds no initialization-failure coverage beyond context startup.
- Querying the PostgreSQL patch version: duplicates the selected container image
  rather than checking application behavior.
- Checking `EntityManagerFactory.isOpen()`: repeats successful JPA initialization.
- Constructing an HTTP client and server URL manually: replaced by Boot's
  auto-configured `RestTestClient` and a JSON-field assertion.
- Registering supported database properties manually: replaced by
  `@ServiceConnection`.
- Combining a shared JVM container with JUnit class-scoped lifecycle: risks
  stopping infrastructure while a cached Spring context still needs it.

## Rules learned

- Name the concrete failure each assertion catches; remove duplicate framework
  checks and keep checks of observable acceptance criteria.
- Prefer Boot-native setup; justify each dependency and check existing starter
  transitive dependencies before adding another declaration.
- Keep tests valid after migrations. Assert required behavior, not empty database
  history or infrastructure patch strings.
- Each data-writing test creates and cleans up its own data; do not rely on test
  order, shared mutable data, or HTTP writes rolling back with the test transaction.
- Distinguish documented compatibility, successful startup, and exercised behavior.
  Service connections bypass production environment-variable wiring; an empty
  changelog does not establish coverage of future migrations.
- Execute only the requested task, review before editing when asked, and update
  the specification before changing requirements. Do not add requirements merely
  to justify an unnecessary assertion.

Version selections and technical decisions remain in [ADR-0001](../../docs/adr/0001-stack-versions.md).
