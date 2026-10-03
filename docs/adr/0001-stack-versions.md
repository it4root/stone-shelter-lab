# ADR 0001: Stack versions

Date: 2026-10-03

Status: Accepted for T002 bootstrap; Java 27 runtime compatibility remains unverified.

## Context

The constitution requires concrete stack versions to be recorded here. The
[bootstrap specification](../../specs/0001-project-bootstrap/spec.md) currently
requires Java 27 and Spring Boot 4.1.1 following the explicit T002 instruction
to use the exact ADR versions. This decision records current stable
upstream releases, excluding milestones, release candidates, snapshots, nightly
builds, and betas. It does not authorize implementing AI features.

## Decision

Record the following latest stable releases verified on 2026-10-03:

| Component | Stable version | Official source |
| --- | --- | --- |
| Java / JDK | 27 | [Oracle JDK 27 release announcement](https://blogs.oracle.com/java/the-arrival-of-java-27) |
| Spring Boot | 4.1.1 | [Spring Boot reference and stable releases](https://docs.spring.io/spring-boot/) |
| Spring AI | 2.0.1 | [Spring AI reference and stable releases](https://docs.spring.io/spring-ai/reference/) |
| PostgreSQL | 18.6 | [PostgreSQL latest releases](https://www.postgresql.org/) |
| Liquibase Community | 5.0.4 | [Liquibase releases](https://github.com/liquibase/liquibase/releases) |
| Testcontainers for Java | 2.0.5 | [Testcontainers Java releases](https://github.com/testcontainers/testcontainers-java/releases) |

Spring AI 2.0.1 belongs to the 2.0.x line, which explicitly supports Spring Boot
4.0.x and 4.1.x according to the [Spring AI getting-started
documentation](https://docs.spring.io/spring-ai/reference/getting-started.html).
Therefore Spring AI 2.0.1 and Spring Boot 4.1.1 satisfy the documented
compatibility requirement. No Boot downgrade is necessary.

Java 27 is the current GA release, but Spring Boot 4.1.1 documents compatibility
only with Java 17 through 26 in its [system
requirements](https://docs.spring.io/spring-boot/system-requirements.html).
The explicit T002 instruction selects Java 27 for the bootstrap. The feature
specification is updated before implementation. This selection does not establish
runtime compatibility; do not claim the entire newest-release combination is supported.

T002 supporting build pins: Maven 3.9.9, Maven Wrapper 3.3.4 (official
only-script distribution), PostgreSQL JDBC 42.7.13 and JUnit 6.0.3 (the
[Boot 4.1.1 managed coordinates](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)),
and ArchUnit 1.5.1 with its JUnit 6 integration (the [official installation
guide](https://www.archunit.org/userguide/html/000_Index.html)). Liquibase 5.0.4
is explicitly pinned over Boot's managed 5.0.3 to follow this ADR. Maven 3.9.9
matches the locally installed Maven version. Spring AI is not added in T002
because the bootstrap specification contains no AI integration requirement.

## Consequences

- Future dependency and container configuration must use concrete versions and
  agree with the approved project selections recorded here.
- Java 27 is pinned as requested for T002, with compatibility outside Boot's
  documented range remaining unverified. Build verification belongs to T003.
- Spring AI can be selected at 2.0.1 with Boot 4.1.1 when a feature specification
  actually calls for it; recording its version does not add a dependency.
- These are upstream release checks and documented compatibility checks, not
  evidence from compiling or running the combined stack. Backend implementation
  must verify dependency resolution, migrations, and PostgreSQL integration,
  including any differences from Boot-managed Liquibase/Testcontainers versions.
- Release inventory is a dated snapshot and requires deliberate review when
  upgrading. PostgreSQL 19 beta and Spring preview releases are excluded.

## Alternatives

- Downgrade Spring Boot for Spring AI compatibility: unnecessary because the
  stable Spring AI 2.0.x line supports Boot 4.1.x. Any future downgrade requires
  explicit user approval.
- Retain Java 23: superseded by the explicit T002 exact-version instruction;
  Java 27 still exceeds Boot's documented compatibility range.
- Choose a supported LTS JDK instead of the newest GA JDK: a possible separate
  runtime decision, requiring a specification update before implementation.
- Use prereleases or floating `latest` versions: rejected because they do not
  satisfy the stable-release request or the repository's explicit-version rule.
- Use Boot-managed dependency versions automatically: may simplify integration,
  but must not be presented as the latest upstream releases without verification.
