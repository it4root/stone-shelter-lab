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
database credentials; edit `.env` if needed. Keep this file out of Git.
## Verify
    curl localhost:8080/actuator/health
    http://localhost:8080/actuator/health

## Layout
    specs/NNN-*/                      one directory per feature
    docs/adr/                         decisions and rationale
    docs/glossary.md                  domain vocabulary
    stone-shelter-api/                Spring Boot backend
    stone-shelter-ui/                 React frontend
