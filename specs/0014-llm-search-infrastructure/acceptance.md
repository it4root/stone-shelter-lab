# Feature 0014: Acceptance Criteria

Criteria live exclusively here. The user authorized all feature implementation
tasks. Record their runtime evidence below; host Ollama setup remains user-owned.

| ID | Given / When | Expected result | Verification |
| --- | --- | --- | --- |
| AC-0014-001 | Initial documentation-only preparation is reviewed | Four English documents reflect the user's infrastructure-only scope, host-managed Ollama and selected model; links/IDs are valid; initial future tasks stayed unchecked; documentation-only preparation did not change runtime files | Historical preparation evidence and current document checks |
| AC-0014-002 | Selected pins are reviewed and later recorded | Existing JDK/Boot/PostgreSQL pins are retained; AI 2.0.1, Redis 8.2.10 Alpine 3.22, Kafka 4.2.2 and pgvector 0.8.6 image/digest have documented sources/reasons; new pins enter ADR-0001 before runtime edits | Dependency POM and official metadata review; later ADR diff |
| AC-0014-003 | The authorized future Compose stack starts | Backend, PostgreSQL/pgvector, MinIO, Redis and Kafka run with bounded readiness checks; the frontend is included when its profile is enabled; no Ollama container exists; existing HTTP/photo behavior remains | Actual Compose and HTTP smoke |
| AC-0014-004 | The selected database image and migration are verified | Ready-made image runs PostgreSQL 18.6; vector extension is enabled by a new Liquibase changeset; existing schema/data/volume layout and applied changesets are preserved; no RAG/analytics tables appear | Disposable Testcontainers migration checks and scoped diff |
| AC-0014-005 | Future env/configuration is checked | Basic settings map to supported selected-version properties; backend uses Compose names and host.docker.internal for Ollama; no private env is overwritten and no secrets are committed | Property metadata/configuration review and connectivity smoke |
| AC-0014-006 | Redis readiness and configuration are exercised | Redis PING works, database 0 is selected, disk persistence is disabled and PT24H is documented as a configurable future memory setting; no ChatMemory adapter or actual conversation-expiry claim appears | Redis/configuration checks; optional isolated short-lived key expiry smoke |
| AC-0014-007 | Kafka is checked | One KRaft broker works with reachable internal/external listener metadata and persistent data; basic 24-hour log retention is configured; no ZooKeeper, UI, application topics or analytics implementation exists | Metadata checks from Docker and host; scoped diff |
| AC-0014-008 | Selected model configuration is inspected | Only qwen2.5:3b is configured; its published approximately 1.9 GB Q4_K_M metadata is recorded; other candidates/model downloads and generation/tool/JSON tests are excluded | Model reference/configuration and scope review |
| AC-0014-009 | Host Ollama setup is documented and later checked | User-managed installation/start/pull steps and Docker-accessible binding are documented; the agent installs/downloads nothing; host version/model inventory is reachable when supplied, otherwise honestly pending | Instruction review and later container-to-host HTTP inventory check |
| AC-0014-010 | Backend dependency/configuration changes are verified | Selected starters build with pinned runtimes and no redundant web/database dependency; auto-pulling/embeddings are disabled; startup and existing stub work without host Ollama; Redis health is enabled in Compose and optional outside it; no new endpoint/business logic | Backend verification, startup/chatbot regression and actual HTTP smoke |
| AC-0014-011 | Scope boundaries are reviewed | RAG, memory behavior, analytics event schemas/AsyncAPI and SSE/Flux contracts are future application work and do not block this feature; both frontend startup modes are confirmed infrastructure requirements, with no pending deployment-scope question | Specification/plan/task review |
| AC-0014-012 | Future infrastructure work is delivered | Evidence distinguishes metadata/document checks from actual runtime checks; unavailable host Ollama checks stay pending; only authorized tasks run; no unauthorized commits/pushes | Criterion-linked commands/results and scoped diff |
| AC-0014-013 | Full Docker mode is started with the frontend profile | One documented Compose command starts frontend, backend and infrastructure; the UI loads on a host-reachable URL, SPA routes survive reload, and /api and /images proxy to the backend service without exposing Compose-only names to browser requests | Rendered Compose and actual UI/proxy/route smoke |
| AC-0014-014 | Base Compose and standalone frontend development are started | Frontend container remains stopped; npm run dev:api starts the host UI against the Docker backend with pinned Node/npm; source edits appear through Vite hot updates without rebuilding images or restarting backend; existing mock command is preserved | Host development, API/image proxy and actual hot-update smoke |
| AC-0014-015 | Frontend modes are switched | Documentation describes port override or stopping only the frontend container before reusing port 5173; backend/infrastructure continue with existing persistent data; either mode uses the same sources and API contract | Mode-switch smoke and command/configuration review |

## Evidence Policy

Do not claim runtime compatibility from a release page or cached POM. Do not
claim model generation, tool calling, JSON formatting, RAG, ChatMemory expiry,
analytics persistence or SSE delivery from basic infrastructure readiness.
Database tests use disposable PostgreSQL Testcontainers, never H2. Do not reset
user volumes, install host software or download models to satisfy these checks.

## Documentation and Research Status — 2026-10-09

Historical preparation evidence below predates implementation authorization.
The final implementation evidence supersedes its pending statuses.

The user narrowed the feature to infrastructure, selected qwen2.5:3b and a
ready-made pgvector image, confirmed backend Docker startup, and took ownership
of host Ollama installation. Documents were revised accordingly; previous model
comparison and application capability-probe tasks were removed from scope.
Existing task/criterion IDs are preserved, and all implementation tasks remain
unchecked. Dependency POM and official metadata findings are recorded in plan.md
and spec.md. Runtime checks and recording new pins in ADR-0001 remain pending.

The user also confirmed frontend inclusion in Compose while retaining standalone
command-based development for quick edits. Both modes are now specified, with
additional acceptance criteria and an unchecked frontend infrastructure task.

Document verification passed: English text, local links, formatting, seven
unchecked tasks and preserved sequential task/criterion IDs. Scoped Git status
shows only the feature documentation; Compose, env, backend and ADR files remain
unchanged. No application tests or services were run.

## Host Ollama Installation Check — 2026-10-09

The user reported that Ollama is installed. `ollama --version` reported client
version 0.40.2 and warned that it could not connect to a running instance.
An HTTP GET to `http://127.0.0.1:11434/api/version` failed to connect. The installed
CLI version is recorded in spec.md; running server version, qwen2.5:3b inventory
and container-to-host connectivity remain pending. No server was started,
model downloaded, host setting changed or implementation task executed.

## Final Implementation Evidence — 2026-10-09

All seven tasks are complete. Verification used the public `.env.example`
explicitly; the existing private `.env` was neither inspected nor overwritten.
Existing unrelated user edits were preserved. No commits or pushes were made
during implementation verification.

| Criterion | Result and evidence |
| --- | --- |
| AC-0014-001 | Passed. Historical documentation-only preparation is preserved above. The four English documents now reflect implementation authorization, completed task IDs and linked evidence. |
| AC-0014-002 | Passed. ADR-0001/0002 record pins before runtime edits; registry manifests and Maven configuration metadata were qualified. Actual builds retain JDK 23.0.2, Boot 4.1.1, PostgreSQL 18.6 and Node/npm 24.21.0/11.19.0. |
| AC-0014-003 | Passed. `docker compose --env-file .env.example --profile frontend up -d --build --wait --wait-timeout 180` exited successfully; all six services were healthy. Base mode subsequently kept five backend/infrastructure services healthy. No Ollama service exists. |
| AC-0014-004 | Passed. Actual database reports PostgreSQL 18.6 and vector 0.8.6. `BootstrapTest` (2 tests) and `StonePhotoDraftMigrationTest` (1 test) passed against disposable pgvector Testcontainers. The extension changeset is recorded once and no vector columns exist. Applied migrations were unchanged. Trixie matches the existing database collation provider; no collation refresh or index rebuild was performed. |
| AC-0014-005 | Passed. Spring AI 2.0.1 metadata verified `spring.ai.ollama.chat.model`, base URL and never-pull properties. Rendered Compose passed in both profiles; actual Redis health, Kafka metadata and backend-to-host Ollama HTTP confirm addresses. Private env files are ignored/excluded from build contexts. |
| AC-0014-006 | Passed. Redis PING returned PONG; CONFIG GET confirmed empty save schedule and appendonly=no. One uniquely named database-0 key with EX 1 was read successfully, then expired. PT24H remains a future application setting; conversation memory was not implemented or tested. |
| AC-0014-007 | Passed. Kafka broker API metadata resolved `kafka:9092` inside Docker. A host Admin client 4.2.1 discovered one broker at `localhost:29092`, including after restart. Generated broker properties show log.retention.hours=24 and auto.create.topics.enable=false. Application topic list is empty and kafka-data mount identity persisted. |
| AC-0014-008 | Passed. Configured and installed model is qwen2.5:3b Q4_K_M, 1,929,912,432 bytes. No alternative model, model pull or capability/generation probe was introduced. |
| AC-0014-009 | Passed. User-owned host setup commands are documented. Backend-container GET /api/version returned 0.40.2; GET /api/tags found the selected model, both before and after restart. No external prerequisite remains pending; the agent did not start/configure Ollama or download models. |
| AC-0014-010 | Passed. Pinned-JDK `./mvnw -q verify` completed: 15 classes, 234 total tests, 233 executed, one existing opt-in transport skip, zero failures/errors. Bootstrap uses an unreachable Ollama URL and still reports UP. Existing chatbot, generated JSON/YAML OpenAPI, migration and architecture tests passed; actual Docker HTTP preserved the exact fixed chatbot response and 400 ProblemDetail validation. Backend Docker build passed. |
| AC-0014-011 | Passed. Scoped diff contains infrastructure/configuration, migration, test and documentation changes only. No new application route/DTO, search, RAG, memory adapter, analytics schema/topic/consumer or SSE contract was introduced. |
| AC-0014-012 | Passed. Runtime evidence is separated from initial research. Only the seven authorized tasks were implemented; no commit/push, volume deletion, host model setup or unrelated edit was performed. |
| AC-0014-013 | Passed. Frontend Docker build checked pinned Node/npm and ran npm ci/build. Full-profile startup served catalog, stone-details and add-stone SPA entry URLs. `/api` preserved chatbot response/validation; `/images` returned identical placeholder PNG bytes to direct backend HTTP. Browser-facing addresses use localhost; proxy targets Compose DNS internally. |
| AC-0014-014 | Passed. Host `npm run lint` and `npm run build` completed. Standalone `npm run dev:api` served the same API/image/SPA checks. A real vite-hmr websocket received a CSS update after a temporary source edit, and the served module contained the edit; the transient smoke file was removed. Existing API/mock scripts and lockfile remain unchanged. |
| AC-0014-015 | Passed. Stopping only the frontend container and starting host Vite on 5173 left all five backend/infrastructure container IDs and start times unchanged. A subsequent authorized restart of PostgreSQL, MinIO, Kafka and API preserved all mount identities and all four existing application table row counts. Existing stone detail and its stored JPEG remained readable (267,865 bytes); backend health, chatbot/proxies, Kafka and host Ollama checks passed again. |

Final running mode: base Compose services are healthy, Docker frontend is stopped,
and host Vite remains available at `http://localhost:5173/stone-shelter/catalog`.
The backend is at `http://localhost:8080`; enabling the frontend profile after
stopping host Vite restores the verified full Docker mode.

UI startup verification used HTTP SPA entries, API/image transport and the actual
Vite hot-update protocol. A visual browser session was unavailable (browser
inventory empty), so no visual rendering/interaction claim is made. The existing
opt-in backend/UI transport test was not enabled in the full backend run; actual
Docker/host transport was checked separately without catalog mutations.
Model generation, Function Calling/JSON quality, RAG, conversation expiry,
analytics delivery and SSE remain outside this feature.

## Frontend Pre-commit Verification — 2026-10-09

The mandatory frontend checks passed consecutively: `npm run lint`,
`npm run test -- --run` (25 files, 193 tests, zero failures), and `npm run build`.
No frontend source, dependency or lockfile change was needed for these checks.
