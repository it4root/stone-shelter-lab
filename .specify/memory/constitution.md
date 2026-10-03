# Constitution — rules that are not up for debate

## Technical
1. Versions are pinned in `../../docs/adr/0001-stack-versions.md`. `pom.xml`,
   `package.json`, `docker-compose.yml` carry concrete versions only.
2. The database schema is managed by Liquibase only. `ddl-auto=validate`.
   A committed changeset file is NEVER edited — only new ones are added.
3. Secrets and addresses reach the app through environment variables only.
   The repository holds `.env.example`. `.env` is in `.gitignore`.
4. Any test that needs a database uses Testcontainers. H2 is banned.
5. API errors use RFC 9457 `ProblemDetail`. A hand-rolled `{error: "..."}` is banned.
6. Paging uses Spring Data `Pageable` only. Response body is strictly:
   `content`, `page`, `size`, `totalElements`.
7. Sorting is restricted to a field whitelist. An unknown field returns 400, not 500.
8. Layers: `controller` -> `service` -> `repository`. Controllers never touch repositories.
9. Persistence entities never leave the `repository` layer — domain models cross the boundary.
10. Every rule above that a test can express must exist as an ArchUnit test.

## Process
1. Spec → plan → tasks → code. No spec, no code.
2. Infrastructure in `docker-compose.yml` may be running without being used.
   A service in compose is NOT permission to write code for it.
3. One commit = one task.

## Language
1. Every artifact in this repository is written in English: docs, ADRs, specs,
   glossaries, code comments, Javadoc, commit messages, branch names, identifiers,
   test names and OpenAPI descriptions. This holds regardless of the language
   used in conversation with the agent.
