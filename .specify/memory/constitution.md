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
11. Each structured controller request and response is represented by a separate
    DTO with the suffix `Request` or `Response`, respectively. For resource
    operations, the DTO name identifies the action and resource. Collections are
    returned inside a response object. 
    StoneCreateRequest
    StoneUpdateRequest
    StoneResponse
    StonesSearchRequest
    StonesSearchResponse
    Collection responses must be wrapped in a dedicated response DTO rather than returning framework collection or pagination types directly.
    Controller DTOs must not be passed directly into the domain or application layer. Controllers must map API DTOs to application/domain models at the API boundary.
    Operations with no request or response body do not require empty DTOs.
    A successful DELETE resource deletion operations covered by this convention must return HTTP 200 with a dedicated response DTO
    containing the deleted item's identifier under the `id` key, for example
    `StoneDeleteResponse` with body `{"id": 7}`. This allows the UI to identify
    the removed item. DELETE must not return HTTP 204 for these operations.
    Do not reuse a single DTO across request and response boundaries solely to reduce duplication.
    Prefer explicit API contracts over inheritance or composition tricks between request and response DTOs unless such reuse is explicitly justified and approved.


12. Name each controller after the domain entity or domain concept it represents,
    followed by the suffix `Controller`, for example `StoneCatalogController`.
13. Creation returns 201  and a dedicated `Create{entity_name}Response`.
    Read, search and full-replacement update return 200 with their respective
    response DTOs. Common errors use ProblemDetail.
14. Use explicit Java imports for each referenced type or static member.
    Wildcard imports (`import ...*` and `import static ...*`) are prohibited,
    including in tests.


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
