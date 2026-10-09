# Feature 0014: Technical Plan

## References and Scope

Follow [spec.md](spec.md), [acceptance.md](acceptance.md), the constitution,
root/backend/frontend AGENTS.md and [ADR-0001](../../docs/adr/0001-stack-versions.md).
The user authorized execution of all implementation tasks. Follow their
dependencies, verify and report each task. Host Ollama setup remains user-owned;
commits and pushes require explicit user authorization. Use the existing Compose/env/application files.

## Dependency and Image Research — 2026-10-09

During planning, inspected the project POM and the locally cached
`spring-boot-dependencies:4.1.1` POM. The application already has Spring MVC,
PostgreSQL JDBC 42.7.13, JPA and Liquibase. Spring AI, Redis and Kafka client
starters were absent. Do not duplicate existing database/web dependencies.

The Boot POM manages Spring Kafka 4.1.1, kafka-clients 4.2.1,
Lettuce 7.5.2.RELEASE, Spring Data BOM 2026.0.1 and Reactor BOM 2025.0.7.
Use these transitive selections; broker and client patch versions need not be
forced to match. Add only the direct starters selected in spec.md, plus AI BOM
2.0.1. Do not add a pgvector-store, Redis ChatMemory, WebFlux server or analytics
consumer dependency for unimplemented application behavior.

Use Kafka 4.2.2 as a supported patch of the client generation already managed
by Boot. The official image inventory lists amd64 and arm64 builds. Use the
Redis 8.2.10 Alpine 3.22 image to limit image size. The researched ready-made
pgvector 0.8.6 PostgreSQL 18 image metadata confirms PostgreSQL 18.6,
`PGDATA=/var/lib/postgresql/18/docker` and the existing parent volume mount.
Pin its multi-platform digest to prevent the PostgreSQL patch from drifting.
Sources and full pins are recorded in spec.md and ADR-0001.

The initial metadata/dependency findings did not prove image pulls, migrations,
application builds or live compatibility. Those runtime checks subsequently
passed; detailed evidence is recorded in acceptance.md. The user installed host Ollama; a read-only `ollama --version`
check reported CLI 0.40.2. The initial loopback version check could not connect. Subsequent backend-container
checks confirmed server 0.40.2 and the installed qwen2.5:3b Q4_K_M inventory.
Do not choose/download a host release or start the server on the user's behalf.

## Compose Preparation

Keep PostgreSQL/MinIO/API service names and current persistent data. Substitute
the selected ready-made PostgreSQL image without resetting the database.
Add Redis with PING health and no disk persistence, and one Kafka KRaft broker
with metadata/readiness checks, a named data volume, internal `kafka:9092` and
localhost-only external `localhost:29092` listener. Keep controller traffic
internal and automatic application topic creation disabled.

Use basic 24-hour broker log retention to avoid the unbounded default retention
of a development setup. No production topology or auxiliary Kafka services.
Choose image-specific environment names and paths from its verified reference
before editing Compose. Provide non-destructive start/stop/status instructions.
No `down -v`, volume reset or broad cleanup belongs to ordinary setup.

Do not add Ollama to Compose. Document host connectivity through
`host.docker.internal:11434` on Docker Desktop and the user-controlled host
listen-address prerequisite. Existing API health must not depend on the host
Ollama server being started. Readiness of Redis/Kafka/PostgreSQL and the host
Ollama reachability check are distinct.

## Frontend Docker and Host Development

Add a frontend service under the `frontend` Compose profile. Use the current
React/Vite stack and lockfile with pinned Node 24.21.0 and npm 11.19.0 in both
host and Docker runs. Qualify the concrete Node container image before adding
the Dockerfile; no additional web-server dependency is needed for this local
development stack. Bind the container Vite server to its container interface
and publish a localhost-only frontend port, default 5173 with an override.

Use the existing API-mode Vite proxy: `API_PROXY_TARGET` is
`http://stone-shelter-api:8080` inside Compose and `http://localhost:8080` for the
host command. Keep `VITE_API_BASE_URL` empty by default. Proxy `/api` and `/images`
without exposing container-only DNS names to browser requests. Preserve SPA
direct navigation/reload and existing API/mock selection.

Document full startup using `docker compose --profile frontend up --build`.
For quick host edits, run base `docker compose up --build`, then the existing
`npm run dev:api` command from stone-shelter-ui after npm ci setup. Keep Vite hot
updates in this host mode, without rebuilding Docker or restarting the backend.
Document stopping only the frontend Compose service when switching to the same
host port; do not use whole-stack teardown to switch frontend modes.

## Database and Backend Configuration

Add a new Liquibase changeset enabling `vector`, preserving applied changesets.
Adapt disposable PostgreSQL Testcontainers to the same selected image and
compatible-image declaration where required. Run the actual migration path;
never weaken database assertions or use H2. Create no vector/analytics tables.

Add the three selected starters and basic property bindings. Verify model
property names against Spring AI 2.0.1 metadata; disable auto-pulling and
embedding initialization. Preserve MVC and the fixed chatbot; do not add model
invocations, forwarding-only services or placeholder business types.

Expose `CHAT_MEMORY_TTL=PT24H` as a documented future application setting without
claiming that conversation expiration is implemented. Redis is an ephemeral
cache in this minimal setup, so restart may clear its data. No retention/ownership
product decisions or memory serialization are needed to launch infrastructure.

## Host Setup Instructions

Document user-run Ollama start/list/pull/version commands and Docker-accessible
host binding using the sources in spec.md. The selected model is qwen2.5:3b;
its published metadata reports Q4_K_M and about 1.9 GB. Do not download a model,
change launchctl settings or install software as part of this feature.

When the user has supplied a running host server, verify HTTP version/model
inventory reachability from the backend container. If it is unavailable, record
that external prerequisite as pending and verify the rest of the stack. No
Function Calling/JSON/generation probes are in scope.

## Verification

Keep document links, IDs, scope and formatting consistent while implementing.
Run actual infrastructure and application checks for authorized tasks; record
results and external prerequisites honestly.

Validate rendered Compose configuration; verify actual
PostgreSQL/vector, Redis PING/isolated short-lived expiration, Kafka metadata and
existing API/MinIO startup. Backend changes require pinned-JDK `./mvnw verify`
and focused chatbot/configuration regressions. Migration checks use disposable
PostgreSQL Testcontainers; each test owns and cleans up its data.

For frontend infrastructure, run relevant frontend lint/build and proxy checks
using existing tooling. Smoke both Docker-profile and host-command modes,
API/image connectivity, SPA reload and actual host hot updates. Verify switching
only frontend startup leaves backend/infrastructure running and data intact.
These runtime checks passed during the authorized implementation; evidence and
the final running mode are recorded in acceptance.md.

Record actual startup/connectivity and unperformed checks in acceptance.md.
Configuration for a 24-hour TTL does not prove ChatMemory expiry; pgvector does
not prove RAG; a reachable Ollama model inventory does not prove tool/JSON
capabilities; a ready Kafka broker does not prove analytics persistence.
All feature tasks are requested; report one line after each.
