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

## Verify
    curl localhost:8080/actuator/health
    http://localhost:8080/actuator/health

## Layout
    specs/NNN-*/                      one directory per feature
    docs/adr/                         decisions and rationale
    docs/glossary.md                  domain vocabulary
    stone-shelter-api/                Spring Boot backend
    stone-shelter-ui/                 React frontend
