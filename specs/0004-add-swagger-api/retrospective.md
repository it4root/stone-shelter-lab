# Backend OpenAPI documentation retrospective

## Work completed

- Clarified the specification and repository rules before implementation.
  Decisions are recorded in [ADR-0004](../../docs/adr/0004-generated-openapi.md).
- Added springdoc Spring MVC Swagger UI starter 3.1.1 and pinned its version
  in ADR-0001. Added shared package/path filtering and disabled inferred
  controller-advice responses. Documentation is enabled in all profiles.
- Added English schema and field descriptions to all 11 shared DTO types,
  including search filter and sort models. API behavior and DTO structures
  remained unchanged.
- Added four documentation tests covering Swagger UI, generated JSON/YAML
  equivalence, all five catalog operations and successful statuses, DTO
  descriptions, and supported validation constraints. Reviewed AC-1 through
  AC-9 against the tests and shared configuration.


## Questions asked before implementation

| Question | User decision |
| --- | --- |
| Should generation replace the handwritten-contract interpretation of the existing contract-first rule? | Generated OpenAPI is the HTTP contract source of truth. |
| Should descriptions cover every Request/Response DTO, field, and nested type? | Yes; use English `@Schema(description = ...)` annotations throughout. |
| Should documentation include successful statuses only or also 400/404/500 ProblemDetail responses? | Document successful statuses only. |
| Should Swagger include only Stone Catalog, or also other endpoints such as Actuator? | Include Stone Catalog and future controllers in the same package scope; restrict paths to `/api/**`. |
| Should Swagger be enabled in every profile or only locally? | Enable it in all profiles; this question was repeated after the other decisions were recorded. |

## Verification

`./mvnw verify` and `./mvnw verify -Dspring.profiles.active=openapi-verification`
each passed on JDK 23.0.2 with PostgreSQL 18.6 Testcontainers: 128 tests,
zero failures, errors, or skips. `git diff --check` passed.
No commit or push was performed.
