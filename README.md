# Stone Shelter Lab

Pet project for practising spec-driven development, AI-first workflow and a
layered Spring Boot + React stack. Not production software.

Phase 1
Single coding agent + human review

Phase 2
Multi-agent development + UI QA

Phase 3
Agentic product features with Spring AI

## Run API

On first launch, copy the local environment template from the repository root:

```sh
cp .env.example .env
```

## Usefull command
docker compose up --build
docker compose up -d --build
docker compose down
docker compose ps

Compose loads `.env` automatically. The template contains development-only
database and MinIO credentials; edit `.env` if needed. Existing `.env` files
need the new MinIO settings from `.env.example`. Keep this file out of Git.

## Local AI Infrastructure

The backend, PostgreSQL 18.6 with pgvector 0.8.6, MinIO, Redis and a single
Kafka 4.2.2 KRaft broker run in Compose. Ollama runs on the host and is managed
by the user. Existing chatbot responses remain fixed; infrastructure does not
implement LLM search, RAG, conversation memory, analytics or streaming.

Preserve an existing `.env`; manually add the non-secret settings documented
in `.env.example` when updating an older setup. To use the published local
examples explicitly without loading a private env file, add
`--env-file .env.example` to each Compose command.

```sh
docker compose up -d --build --wait --wait-timeout 180
docker compose ps
docker compose stop
docker compose start
```

Start only the infrastructure when the backend is not needed:

```sh
docker compose up -d --wait postgres minio redis kafka
```

PostgreSQL and MinIO keep their existing named volumes; Kafka also has a
persistent volume. Normal `stop`, `start` and rebuild commands preserve them.
Do not use `down -v` for routine setup or frontend mode switching. Redis is an
ephemeral local cache with AOF/RDB disabled; its data can disappear on restart.
`CHAT_MEMORY_TTL=PT24H` is a future application setting, not implemented memory.

The backend connects to Redis at `redis:6379`, Kafka at `kafka:9092`, and the
host Ollama server at `http://host.docker.internal:11434`. Kafka's external
listener is `localhost:29092`, overridable by `KAFKA_EXTERNAL_PORT`; controller
traffic and Redis remain internal. Broker logs retain 24 hours by default,
controlled by `KAFKA_LOG_RETENTION_HOURS`. No application topics are created.

```sh
docker compose exec redis redis-cli ping
docker compose exec kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server kafka:9092
curl --fail http://localhost:8080/actuator/health
```

Feature scope and evidence live in
[0014-llm-search-infrastructure](specs/0014-llm-search-infrastructure/spec.md).

## Stone Photo Storage

Compose builds a pinned MinIO release from official binaries with checksum
verification. PostgreSQL stores gallery metadata and MinIO stores image bytes
in persistent volumes. The bucket is private. `MINIO_BROWSER_ENDPOINT` must
be reachable by the browser; the local default is `http://localhost:9000`.
The MinIO console is at `http://localhost:9001`.

Use the generated contract at `/v3/api-docs` or `/v3/api-docs.yaml` for current
HTTP requirements. For an existing stone, upload a supported image with:

```sh
curl --fail-with-body -F 'file=@stone.png;type=image/png' \
  http://localhost:8080/api/v1/stones/1/photos
```

Read `/api/v1/stones/1` for ordered gallery metadata and temporary image URLs.
The first successfully added photo supplies the catalog cover. The React UI uses the real API by default and supports optional photo uploads
when creating a stone. It also offers an explicit standalone mock mode. Run both
modes using the [UI instructions](stone-shelter-ui/README.md).

Photo deletion is deferred to a scheduler inside the backend. By default it runs
at 03:00 UTC daily, checks MinIO write readiness, and processes paced batches.
Deletion requests remove database metadata and queue owned files; failed uploads
retain durable cleanup intent. Storage failures stop a run and preserve work for
the next day. Configure cron/timezone and processing limits using the
PHOTO_CLEANUP_* settings in `.env.example`. The current deployment uses one
backend scheduler instance.

Feature decisions and verification are in
[0006-stone-details](specs/0006-stone-details/spec.md).

## Stone Reservations

POST `/api/v1/stones/{id}/reservations` with JSON fields `applicantName` and
`contactDetails` to reserve an available stone. Both fields accept arbitrary
nonblank text. Creation returns 201 with the reservation id, stoneId, RESERVED
adoptionStatus and createdAt. The reservation and status change commit together;
duplicates or unavailable stones return 409 ProblemDetail. Deleting the stone
removes its dependent reservation. Generated OpenAPI remains the HTTP contract.

The React details page submits adoption applications through the real API and
refreshes details and the AVAILABLE-only catalog. Explicit mock mode and ordinary
UI tests retain the same flow without a backend. Reservation decisions are in
[0007-adopt-stone](specs/0007-adopt-stone/spec.md); integrated launch instructions
and verification are in [0011-ui-api-integration](specs/0011-ui-api-integration/spec.md).

## Stone Chatbot Demo

`POST /api/v1/chat/messages` accepts `conversationId` (UUID), `message` and
optional `context.stoneId`. The controller returns fixed `text` and ordered
`stones` references; no AI or server history is connected. The UI preserves its
conversation across client-side page changes and resets it on reload.
See [feature 0012](specs/0012-stone-chatbot/spec.md).

From `stone-shelter-api`, run only its backend checks with the pinned JDK:

```sh
./mvnw -Dtest=StoneChatbotControllerTest,StoneChatbotArchitectureTest verify
```

To include the actual UI adapter/Vite proxy smoke, first install the UI's pinned
dependencies and run `npm run build` there, then use:

```sh
./mvnw -Dtest=StoneChatbotControllerTest,StoneChatbotArchitectureTest,StoneChatbotTransportTest -Dchatbot.transport=true verify
```

The transport test starts temporary local servers without a database or catalog
mutations. It is opt-in so ordinary backend verification does not require Node
or installed frontend dependencies.

## Verify
    curl localhost:8080/actuator/health
    http://localhost:8080/actuator/health

## Layout
    specs/NNN-*/                      one directory per feature
    docs/adr/                         decisions and rationale
    docs/glossary.md                  domain vocabulary
    stone-shelter-api/                Spring Boot backend
    stone-shelter-ui/                 React frontend
