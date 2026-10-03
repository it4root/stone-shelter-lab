# Task: Bootstrap Stone Shelter repository
Implement project bootstrap only.
Do not implement any business feature.

## Goal
Prepare a working development foundation for subsequent spec-driven features.
The result must contain a runnable Spring Boot backend, a runnable React frontend, and local Docker infrastructure.

## Backend
Create `stone-shelter-api` as a Maven Spring Boot application.
Use:
- JDK 23.0.2 (selected in ADR-0001; compile with Java release 23)
- Spring Boot 4.1.1
- Spring Web
- Spring Boot Actuator
- Spring Data JPA
- PostgreSQL driver
- Liquibase
- JUnit
- Testcontainers
- ArchUnit

Requirements:

- provide Maven Wrapper;
- require JDK 23.0.2 for the Maven build;
- application must compile;
- tests must run;
- expose Spring Boot Actuator health endpoint;
- configure PostgreSQL using environment variables;
- Liquibase must be enabled;
- create an initial empty/root Liquibase changelog if necessary;
- application must start successfully against PostgreSQL.


## Backend Docker

Create a multi-stage `Dockerfile` for `stone-shelter-api`.

The Docker image must:

- build the application;
- run the packaged application;
- not require Maven to be installed on the host.

## Local infrastructure

Create root `compose.yaml`.

For now it must contain:

- PostgreSQL;
- stone-shelter-api.

Configure:

- database;
- user;
- password;
- networking;
- backend database connection through environment variables;
- health checks where appropriate.

Running:

`docker compose up --build`

must result in a healthy PostgreSQL instance and a running backend application.

The backend health endpoint must respond successfully.


## Agent instructions

Create:

- root `AGENTS.md`;
- `stone-shelter-api/AGENTS.md`;

Keep instructions concise.

Root instructions must describe:

- spec-driven workflow;
- repository structure;
- verification requirements;
- prohibition against implementing undocumented functionality.

Backend instructions must contain backend-specific conventions.

Frontend instructions must contain frontend-specific conventions.

## Verification

Before completing the task, run all applicable verification commands.

At minimum verify:

Backend:

`./mvnw verify`

PostgreSQL integration tests must inherit a common test base that starts one
PostgreSQL 18.6 container per test JVM and supplies connection details through
Spring Boot's `@ServiceConnection`, rather than manual datasource properties.
The container must remain available between test classes and be cleaned up by
Testcontainers at JVM exit. Do not reuse it across separate test runs.
Tests that modify data must isolate or clean up their own data; shared container
state does not imply test isolation.

The bootstrap integration test must start against this PostgreSQL container
with Liquibase enabled and verify successful application startup and health.
Use an auto-configured Spring Boot RestTestClient with RANDOM_PORT to check
HTTP 200 and the JSON status UP at `/actuator/health`.
Liquibase initialization failures must fail context startup; the test must not
assert details of Liquibase's internal tracking tables.

Frontend:

`npm test`
`npm run lint`
`npm run build`

Docker:

`docker compose up --build`

Verify that the backend health endpoint responds successfully.

If any verification fails, fix the problem and rerun verification.

## Completion report

When finished, report:

1. files/directories created;
2. important technical decisions made;
3. commands executed;
4. verification results;
5. anything deliberately not implemented.

Do not proceed to the Rock Catalog feature.
