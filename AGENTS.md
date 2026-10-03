# Stone Shelter

## Project goal

Educational project for practicing:
- spec-driven development
- AI-first development
- contract-first API design
- autonomous coding-agent workflows

## Mandatory workflow

For every feature:

1. Read the feature specification.
2. Do not implement undocumented requirements.
3. Update specification before implementation if behavior changes.
4. Define or update contracts before backend/frontend implementation.
5. Implement.
6. Run verification.
7. Check implementation against acceptance criteria.

## Repository structure

| Path                                 | What lives there                       |
|--------------------------------------|----------------------------------------|
| `.specify/memory/constitution.md`    | Non-negotiable rules. Read this FIRST  |
| `specs/NNN-*/spec.md`                | Feature spec: what and why             |
| `specs/NNN-*/plan.md`                | Technical decisions for the feature    |
| `specs/NNN-*/tasks.md`               | Task checklist for the feature         |
| `specs/NNN-*/contracts/openapi.yaml` | API contract for the feature           |
| `docs/adr/NNNN-*.md`                 | Decisions and their rationale          |
| `docs/glossary.md`                   | Ubiquitous language for the domain     |
| `stone-shelter-api/`                 | Spring Boot backend                    |
| `stone-shelter-ui/`                  | React frontend                         |
| `compose.yml`                        | Infrastructure: postgres, minio, kafka |

## Feature workflow (mandatory)
1. Read `constitution.md` and the current feature spec.
2. If there is no spec — do NOT write code. Say so and stop.
3. Write code task by task from `tasks.md`. One task = one commit.
4. After each task: run tests, report back in one line.

## Rules

- OpenAPI is the source of truth for HTTP API contracts.
- AsyncAPI is the source of truth for Kafka contracts.
- Database schema changes require Liquibase migrations.
- Never modify an already applied Liquibase migration.
- Do not introduce libraries without a reason.
- Do not implement speculative functionality.
- Prefer the smallest change satisfying the current spec.
- When asked to execute a specific task ID, execute only that task. Do not automatically continue with subsequent tasks.
- All artifacts are in English, including commit messages and comments, even when
  our conversation is in another language.
## Current constraints
- Do not add a dependency when `pom.xml` / `package.json` already covers the need.
- Do not create a file until there is a real reason for it.
- Do not bend a test to fit the code. If a test is red, fix the code.
- All versions explicit. Never `latest`.
## Local rules
`stone-shelter-api/AGENTS.md` and `stone-shelter-ui/AGENTS.md` hold additions
specific to each side. They extend this file, they do not replace it.

