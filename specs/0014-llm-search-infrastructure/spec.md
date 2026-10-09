# Feature 0014: LLM Search Infrastructure

## Goal and Authorization

Prepare local Docker infrastructure and basic backend connection configuration
for future LLM search. This feature contains no business logic.

The user authorized continuous execution of all feature implementation tasks.
Verify and report each task, then proceed according to dependencies. Host Ollama
installation/settings and model downloads remain user-owned. Commit or push only
when explicitly requested by the user.

Acceptance criteria live exclusively in [acceptance.md](acceptance.md).
Technical decisions live in [plan.md](plan.md); tasks live in [tasks.md](tasks.md).

## Confirmed Deployment and Scope

- Run the backend and infrastructure through the existing root `compose.yaml`.
- Include the React frontend in Compose and preserve a separate host development
  command with live updates for quick UI edits.
- Use a ready-made PostgreSQL image containing pgvector; no custom database build.
- Run Redis and Kafka in Docker, alongside the existing PostgreSQL and MinIO.
- Ollama runs directly on the host and is installed by the user. Do not add an
  Ollama Compose service, image, model volume or installation automation.
- Use the user-selected `qwen2.5:3b`; do not compare or download other models.
- Prepare Spring AI and basic Redis/Kafka connection dependencies/configuration.
- Preserve all existing catalog, photo and fixed chatbot HTTP behavior.
- LLM search, RAG, ChatMemory, analytics and streaming implementation are outside
  scope. Their product design is not a prerequisite for this infrastructure.

Frontend inclusion and both startup modes are confirmed. No deployment-scope
clarification remains. All implementation tasks are now authorized.

## Frontend Startup Modes

Support two documented modes using the same React sources, existing API contract
and pinned frontend dependencies:

| Mode | Startup | API connection |
| --- | --- | --- |
| Full Docker stack | From the repository root, `docker compose --profile frontend up --build` starts frontend, backend and infrastructure | Frontend proxy targets `http://stone-shelter-api:8080` inside the Compose network |
| Host frontend development | Start backend/infrastructure with `docker compose up --build`; from `stone-shelter-ui`, run `npm run dev:api` | Existing local `API_PROXY_TARGET=http://localhost:8080` configuration targets the Docker backend |

Place the frontend service in the `frontend` Compose profile so the base command
does not start it. The full-stack command explicitly enables that profile.
Document `npm ci` as the host dependency setup step before the first development
run, using the existing lockfile and pinned Node/npm versions.

The standalone Vite mode provides hot updates for source edits without Docker
image rebuilds or backend restarts. Preserve existing `dev` and `dev:mock`
commands; the two deployment modes do not replace the existing API/mock choice.
Use port 5173 by default for either frontend mode, with a documented override.
Stop the Compose frontend before using that same port on the host; switching
modes must not restart or delete backend/database/photo/Kafka data.

Keep `VITE_API_BASE_URL` empty by default and proxy both `/api` and `/images`
through the active frontend server. Browser requests must use a browser-reachable
frontend URL; Compose service names belong only to server-side proxy targets.
The full Docker frontend must serve the existing `/stone-shelter/` SPA routes,
including direct navigation/reload. Do not change UI behavior or add a new HTTP
client to support these modes.

## Selected Versions

Versions were researched on 2026-10-09. These are deliberate reproducibility
selections, not a claim that every selection is the newest upstream release.
Record new pins in [ADR-0001](../../docs/adr/0001-stack-versions.md) during an
explicitly authorized implementation task, before changing runtime files.

| Component | Selection | Rationale / evidence |
| --- | --- | --- |
| JDK / Spring Boot | 23.0.2 / 4.1.1 | Preserve existing project pins and parent POM |
| Frontend Node / npm | 24.21.0 / 11.19.0 | Preserve the existing package.json engine pins and lockfile in both startup modes; pinned container build verifies both versions |
| Spring AI Ollama starter | 2.0.1 | Preserve the ADR pin; Spring AI 2.0.x supports Boot 4.1.x according to its [getting-started reference](https://docs.spring.io/spring-ai/reference/getting-started.html) |
| PostgreSQL / pgvector | 18.6 / 0.8.6 | Ready-made `pgvector/pgvector:0.8.6-pg18-trixie`; [image metadata](https://hub.docker.com/layers/pgvector/pgvector/0.8.6-pg18-trixie/images/sha256-d589b1c85160432264bbe7d532bcae4d3813c39702a8faf6971ec42c81b71e21) reports PostgreSQL 18.6 and pgvector 0.8.6 |
| Redis | `redis:8.2.10-alpine3.22` | Published explicit patch/Alpine image in the [official image inventory](https://hub.docker.com/_/redis); compact local deployment |
| Kafka broker | `apache/kafka:4.2.2` | Supported patch in the 4.2 line, close to Boot's managed kafka-clients 4.2.1; [Apache release inventory](https://kafka.apache.org/community/downloads/) and [image tags](https://hub.docker.com/r/apache/kafka/tags) |
| Redis / Kafka starters | 4.1.1 / 4.1.1 | Match the existing Spring Boot parent; both are in its [managed coordinates](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html) |
| Ollama runtime | 0.40.2 (host CLI and server) | CLI and backend-container GET /api/version verified on 2026-10-09; user-managed host installation, no Docker pin |
| Chat model | `qwen2.5:3b` | Explicit user choice; [Ollama metadata](https://ollama.com/library/qwen2.5:3b) lists Q4_K_M and approximately 1.9 GB |

Pin the selected pgvector image additionally by its verified multi-platform
index digest during implementation, since its tag names the PostgreSQL major,
not the patch. Published index digest for the researched image:
`sha256:78bf48b801e792f99e3ac62b5036fd3876e9be48afda16c1e331af1c75ceb2ff`.
Use Trixie to preserve the existing database's glibc 2.41 collation provider;
the initially researched Bookworm variant was rejected after a read-only
existing-database check reported a provider-version mismatch. Do not refresh
collation metadata or rebuild indexes to mask that mismatch.
Verify the selected architecture and PostgreSQL patch before using it; do not
silently substitute a different image or PostgreSQL version.

The qualified frontend image is
`node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20`,
recorded in [ADR-0002](../../docs/adr/0002-stack-ui-versions.md). Its manifest
supports amd64/arm64, and the actual build verified Node/npm versions.

## PostgreSQL and pgvector

Preserve PostgreSQL 18.6, existing credentials, tables and `postgres-data` volume
at `/var/lib/postgresql`. Add a new Liquibase migration enabling `vector` after
the selected image supplies the extension. Applied migrations remain immutable;
keep `ddl-auto=validate` and Liquibase as the schema owner.

Do not add vector tables, indexes, embedding dimensions, an embedding model or
an ingestion process. No RAG/vector-store starter is required for extension
availability. Basic connection configuration uses the existing datasource.

## Redis and Memory Configuration

Provide Redis on the Compose network, with a PING readiness check and basic
Spring Redis connection settings. Use database 0 and an in-memory local cache;
do not enable AOF/RDB or add a Redis data volume in this minimal setup. Data may
be lost when Redis restarts. No host-published Redis port is required for the
containerized backend.

Expose `CHAT_MEMORY_TTL=PT24H` as a documented setting for future ChatMemory.
This is an application configuration value, not a Redis-wide TTL switch. Do not
implement conversation keys, serialization, retention refresh, history limits,
ownership or a memory adapter. Those choices do not block infrastructure startup.

## Kafka

Use one broker with combined broker/controller roles in KRaft mode, replication
factor 1 for required internal topics and a persistent Kafka data volume. No
ZooKeeper, Kafka UI, Schema Registry or additional analytics service is required.

The backend uses `kafka:9092`. Provide a localhost-only external listener on
`localhost:29092` for manual tools and readiness verification. Advertised
listeners must match these addresses. Keep automatic application topic creation
disabled; create no application topics, producers, consumers or analytics tables.

Use a basic local broker log-retention limit of 24 hours, configurable through
environment settings; this is distinct from the future ChatMemory TTL.
The future analytics flow remains application -> Kafka -> PostgreSQL. AsyncAPI
is required before application Kafka contracts/code, but there is no event
contract to create for broker-only provisioning.

## Host Ollama and Spring AI

The containerized backend connects to
`http://host.docker.internal:11434`, configurable through environment variables.
The backend must not use `localhost` for the host Ollama connection. The host
installation must listen on an address accessible to Docker Desktop; document
this prerequisite using [Docker host-networking guidance](https://docs.docker.com/desktop/features/networking/networking-how-tos/)
and the [Ollama host configuration instructions](https://docs.ollama.com/faq).
The agent must not change host Ollama configuration on the user's behalf.

Provide user-run instructions for installing/starting Ollama, making it reachable
and pulling `qwen2.5:3b`. Do not run those instructions automatically. Basic
verification checks the server/version and model inventory, not generated
answers, tool calls, structured JSON or model quality. If Ollama is not installed
or started yet, report its connectivity check as pending; existing backend
startup and its HTTP operations must still work.

Prepare `spring-ai-starter-model-ollama:2.0.1`,
`spring-boot-starter-data-redis:4.1.1` and
`spring-boot-starter-kafka:4.1.1` only where the existing POM does not cover them.
Use the AI BOM at 2.0.1 and explicit direct dependency versions. Do not override
Boot-managed Redis/Kafka transitive versions merely to match server versions.
Keep model auto-pulling disabled and embedding auto-configuration disabled.
Retain the existing Spring MVC application; do not add a WebFlux server starter.

## Basic Environment Settings

Extend `.env.example` and pass the relevant settings to the backend in Compose.
Keep `.env` ignored; do not inspect or overwrite an existing private `.env`.

| Variable | Basic value / meaning |
| --- | --- |
| Existing PostgreSQL / MinIO variables | Preserve current names and values in the examples |
| `SPRING_DATA_REDIS_HOST` | `redis` |
| `SPRING_DATA_REDIS_PORT` | `6379` |
| `SPRING_DATA_REDIS_DATABASE` | `0` |
| `REDIS_HEALTH_ENABLED` | `true` in Compose; false outside Compose so isolated backend tests/startup do not require Redis |
| `CHAT_MEMORY_TTL` | `PT24H`; future memory setting only |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` |
| Broker retention setting | 24 hours; map to the selected Kafka image's supported configuration |
| `SPRING_AI_OLLAMA_BASE_URL` | `http://host.docker.internal:11434` |
| `SPRING_AI_OLLAMA_CHAT_MODEL` | `qwen2.5:3b`; `spring.ai.ollama.chat.model` in the selected reference |
| `SPRING_AI_OLLAMA_INIT_PULL_MODEL_STRATEGY` | `never` |
| `SPRING_AI_MODEL_EMBEDDING` | `none`; no embedding model in this feature |

Verify actual binding against the selected dependency metadata before runtime
configuration changes. No prompt, tool, analytics schema, vector dimension or
SSE event configuration is required. New host-published ports bind to localhost.

## HTTP and Future Application Requirements

Introduce no HTTP endpoint or DTO change. Preserve feature 0012's JSON stub at
`POST /api/v1/chat/messages`, generated `/v3/api-docs` and `/v3/api-docs.yaml`.
Do not maintain handwritten OpenAPI.

The original requirements for future application work remain Spring AI tool/
function calling, structured JSON, pgvector-backed RAG, Redis ChatMemory with
TTL, Kafka analytics stored in PostgreSQL, and SSE with Reactor Flux. They are
outside this feature's execution and acceptance for running infrastructure.
Specify their behavior, HTTP/AsyncAPI contracts and acceptance criteria in later
application work before implementation. Do not require these decisions now.

## Exclusions

No search business logic, model generation/capability probes, RAG/embeddings,
ChatMemory adapter, analytics pipeline, application Kafka topics, SSE endpoints,
UI behavior changes, host installation automation or production deployment.
All feature implementation tasks are authorized. Commits and pushes require
separate explicit user authorization.

## Verified Host Model Inventory — 2026-10-09

Backend-container GET /api/tags found qwen2.5:3b, Q4_K_M, size 1,929,912,432
bytes, digest `357c53fb659c5076de1d65ccb0b397446227b71a42be9d1603d46168015c9e4b`.
This verifies inventory/reachability only, not generation or tool/JSON quality.
The agent did not install Ollama, download models or modify host Ollama settings.
