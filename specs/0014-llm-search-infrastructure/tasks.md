# Feature 0014: Tasks

Requirements live in [spec.md](spec.md), technical decisions in [plan.md](plan.md)
and acceptance criteria exclusively in [acceptance.md](acceptance.md).

The user authorized continuous execution of all tasks below. Follow dependency
order, verify and report one line per task, and proceed until the checklist is
complete. Host Ollama setup/downloads remain user-owned. Commits and pushes
require separate authorization. Any
requested commit starts with `0014-llm-search-infrastructure:` and uses the full
task ID; one task corresponds to one commit.

IDs are preserved from the initial draft. Task content now reflects the
infrastructure-only scope, selected model and user-managed host Ollama.

- [x] T0014-001 Record the researched selections in the relevant stack ADRs, verify chosen image manifests/host architecture and exact supported client properties before runtime edits, including a concrete frontend image matching the existing Node/npm pins; preserve existing pins and select no alternative model.
- [x] T0014-002 Prepare Compose services/readiness and .env.example for the ready-made pgvector PostgreSQL image, ephemeral Redis and single Kafka KRaft broker, preserving backend/MinIO/data; configure basic addresses/retention/TTL and host Ollama URL without an Ollama service. Document basic Docker commands and validate configuration/readiness. Depends on T0014-001.
- [ ] T0014-003 Add a new Liquibase migration enabling vector and adapt disposable PostgreSQL Testcontainers to the selected pgvector image; preserve applied changesets/schema/data and introduce no vector/analytics tables. Run relevant backend verification. Depends on T0014-002.
- [ ] T0014-004 Prepare explicitly versioned Spring AI Ollama, Redis and Kafka starters and basic supported environment bindings; disable model auto-pulling/embedding initialization and preserve MVC/stub behavior without requiring host Ollama at startup. Run backend verification and focused configuration/chatbot regressions. Depends on T0014-003.
- [ ] T0014-005 Document user-owned host Ollama setup and qwen2.5:3b pull/inventory/version steps; when the user has supplied the server, check its version and model inventory from the backend container. Do not install software, download models, change host settings or run model capability probes. Record an unavailable host prerequisite as pending. Depends on T0014-004.
- [ ] T0014-006 Verify actual PostgreSQL/vector, Redis and Kafka connectivity/readiness, non-destructive persistent-data restart and unchanged backend/MinIO HTTP behavior; smoke both frontend startup modes and record acceptance evidence and pending external prerequisites, then review the infrastructure-only diff. Depends on T0014-005 and T0014-007; host Ollama availability does not block verification of the Docker stack.
- [ ] T0014-007 Prepare frontend Docker configuration and the frontend Compose profile using existing pinned Node/npm, React/Vite and lockfile; document full-stack and standalone npm run dev:api startup, initial npm ci setup, proxy addresses and frontend-only mode switching/port overrides. Preserve SPA/API/mock behavior and verify relevant frontend checks plus Docker/host proxy, route and hot-update smoke. Depends on T0014-002. This newly added task does not renumber existing IDs.

## Confirmed Deployment and Execution Boundary

Frontend startup supports both full Compose and standalone host development;
backend/infrastructure remain in Docker in either mode. qwen2.5:3b and host-managed
Ollama are confirmed. No deployment-scope clarification remains. LLM search
behavior, RAG, ChatMemory, analytics contracts and SSE/Flux implementation are
not subsequent tasks in this feature. Implementation status is recorded in the checklist and evidence below.

## Implementation Evidence

- T0014-001: registry manifests and Spring AI 2.0.1 Maven metadata verified; backend/frontend ADR pins recorded; existing runtime pins preserved. Documentation/link/format checks passed.
- T0014-002: Compose validation passed; PostgreSQL 18.6 / pgvector 0.8.6, Redis PING and Kafka metadata/readiness passed. Trixie preserves the existing database collation provider; named volumes were preserved.
