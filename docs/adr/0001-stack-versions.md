# ADR 0001: Stack versions

Date: 2026-10-03

Status: Accepted; project runtime changed to JDK 23.0.2 by explicit user instruction.

## Context

The constitution requires concrete stack versions to be recorded here. The
[bootstrap specification](../../specs/0001-project-bootstrap/spec.md) currently
requires JDK 23.0.2 and Spring Boot 4.1.1. The user selected JDK 23.0.2 instead
of Java 25. This decision records stable
upstream releases, excluding milestones, release candidates, snapshots, nightly
builds, and betas. It does not authorize implementing AI features.

## Decision

Use these project versions. JDK 23.0.2 is an intentional selection rather than
the newest GA Java release; the other releases were verified on 2026-10-03:

| Component | Selected version | Official source |
| --- | --- | --- |
| Java / JDK | 23.0.2 | [Spring Boot Java requirements](https://docs.spring.io/spring-boot/system-requirements.html) |
| Spring Boot | 4.1.1 | [Spring Boot reference and stable releases](https://docs.spring.io/spring-boot/) |
| Spring AI | 2.0.1 | [Spring AI reference and stable releases](https://docs.spring.io/spring-ai/reference/) |
| PostgreSQL | 18.6 | [PostgreSQL latest releases](https://www.postgresql.org/) |
| Liquibase Community | 5.0.4 | [Liquibase releases](https://github.com/liquibase/liquibase/releases) |
| Apache Commons Lang | 3.20.0 | [Official release download](https://commons.apache.org/proper/commons-lang/download_lang.cgi) |
| Testcontainers for Java | 2.0.5 | [Testcontainers Java releases](https://github.com/testcontainers/testcontainers-java/releases) |

Spring AI 2.0.1 belongs to the 2.0.x line, which explicitly supports Spring Boot
4.0.x and 4.1.x according to the [Spring AI getting-started
documentation](https://docs.spring.io/spring-ai/reference/getting-started.html).
Therefore Spring AI 2.0.1 and Spring Boot 4.1.1 satisfy the documented
compatibility requirement. No Boot downgrade is necessary.

Spring Boot 4.1.1 documents compatibility with Java 17 through 26 in its [system
requirements](https://docs.spring.io/spring-boot/system-requirements.html).
Java 23 is within this range. Maven compiles with release 23; Maven Enforcer
3.5.0 requires the actual build JDK to be exactly 23.0.2. The specification is updated before the Maven
configuration. Documented support is distinct from a successful project build.

T002 supporting build pins: Maven 3.9.9, Maven Wrapper 3.3.4 (official
only-script distribution), PostgreSQL JDBC 42.7.13 and JUnit 6.0.3 (the
[Boot 4.1.1 managed coordinates](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)),
and ArchUnit 1.5.1 with its JUnit 6 integration (the [official installation
guide](https://www.archunit.org/userguide/html/000_Index.html)). Liquibase 5.0.4
is explicitly pinned over Boot's managed 5.0.3 to follow this ADR. Maven 3.9.9
matches the locally installed Maven version. Spring AI is not added in T002
because the bootstrap specification contains no AI integration requirement.

The bootstrap HTTP test uses the test-scoped `spring-boot-resttestclient` module
4.1.1 with `@AutoConfigureRestTestClient`, following the [Boot running-server
test guidance](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html#testing.spring-boot-applications.with-running-server).
The general test starter does not supply this auto-configuration module.

PostgreSQL integration tests share the singleton container in
`IntegrationTest` within one test JVM, using the [official singleton
lifecycle pattern](https://java.testcontainers.org/test_framework_integration/manual_lifecycle_control/#singleton-containers).
JUnit does not manage its lifecycle; Ryuk cleans it up on JVM exit. Shared
`@ServiceConnection` supplies JDBC and Liquibase connection details from the
shared PostgreSQL container, using the test-scoped `spring-boot-testcontainers`
module 4.1.1 as required by [Boot's service connection support](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html#testing.testcontainers.service-connections).
The unused JUnit Testcontainers extension dependency is removed. This shared
configuration permits Spring context caching when the remaining
context configuration matches. This does not isolate test data or share a
container between JVM forks. With only one integration class, no performance
gain is claimed.

### Compatibility review after selecting JDK 23.0.2

| Dependency group | Review result |
| --- | --- |
| Boot Web MVC, Actuator, Data JPA, Liquibase starter, test starter and Maven plugin 4.1.1 | Same Boot release throughout the project; Java 23 is supported and bootstrap integration passes on JDK 23.0.2. |
| Spring Framework 7.0.9, Spring Data JPA 4.1.1, Hibernate 7.4.5.Final, Tomcat 11.0.24, Jackson 3.1.5 | Resolved through Boot's dependency management; no independent overrides introduced. |
| PostgreSQL JDBC 42.7.13 | Matches Boot's managed version; connects to PostgreSQL 18.6 in the bootstrap test. |
| Liquibase Community 5.0.4 | Explicit patch override of Boot's managed 5.0.3; processes the empty root changelog and creates its tracking table with PostgreSQL 18.6. |
| Testcontainers 2.0.5, including PostgreSQL and JUnit Jupiter modules | Starts and cleans up the PostgreSQL 18.6 test container on JDK 23.0.2. |
| JUnit Jupiter and Platform 6.0.3 | Managed by Boot; [requires Java 17 or newer](https://docs.junit.org/6.0.3/overview.html). |
| ArchUnit JUnit 6 integration 1.5.1 | The [1.5 release line](https://github.com/TNG/ArchUnit/releases) supports JUnit 6; three architecture checks pass on JDK 23.0.2. |
| Spring AI 2.0.1 | Documented Boot 4.1.x compatibility; absent from the project's dependency tree, so no integration was tested. |

Verification used the installed Homebrew OpenJDK 23.0.2, Maven Wrapper 3.3.4
and Maven 3.9.9. `./mvnw clean verify` passed for the original three tests;
after adding the bootstrap integration test, `./mvnw verify` passed with four
tests and zero failures/errors/skips. The integration test checks successful
context startup with PostgreSQL 18.6 and Liquibase enabled, JPA initialization and HTTP
200 with UP status at `/actuator/health`. Maven validation on JDK 25 also
confirmed that Enforcer rejects the wrong runtime version.

The [Liquibase Community 5.0.4 PostgreSQL support
page](https://docs.liquibase.com/community/integration-guide-5-0-4/what-support-does-liquibase-have-for-postgresql)
lists vendor-verified PostgreSQL versions only through 17, not 18. The local
bootstrap test now demonstrates this project's empty root changelog works with
18.6; it does not establish support for every future migration or Liquibase command.

## Consequences

- Future dependency and container configuration must use concrete versions and
  agree with the approved project selections recorded here.
- JDK 23.0.2 replaces Java 25 in the project pins. The remaining bootstrap task
  checklist is unchanged by this compatibility review.
- Spring AI can be selected at 2.0.1 with Boot 4.1.1 when a feature specification
  actually calls for it; recording its version does not add a dependency.
- Compilation, architecture tests and PostgreSQL bootstrap integration pass on
  JDK 23.0.2. Future schema changes still require their own integration tests.
- Release inventory is a dated snapshot and requires deliberate review when
  upgrading. PostgreSQL 19 beta and Spring preview releases are excluded.

## Alternatives

- Downgrade Spring Boot for Spring AI compatibility: unnecessary because the
  stable Spring AI 2.0.x line supports Boot 4.1.x. Any future downgrade requires
  explicit user approval.
- Retain Java 27: rejected by the user; it exceeds Boot's documented range.
- Retain Java 25: superseded by the user's JDK 23.0.2 selection.
- Use prereleases or floating `latest` versions: rejected because they do not
  satisfy the stable-release request or the repository's explicit-version rule.
- Use Boot-managed dependency versions automatically: may simplify integration,
  but must not be presented as the latest upstream releases without verification.

### Apache Commons Lang addition (2026-10-05)

By explicit user choice, add org.apache.commons:commons-lang3:3.20.0 as a
direct dependency for StringUtils. isEmpty checks null and empty strings without
changing whitespace. The photo normalization use case is superseded: photo
values are now preserved unchanged and the service no longer uses StringUtils.
The release requires Java 8 or newer and is compatible with the selected JDK.
