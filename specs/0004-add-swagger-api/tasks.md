- [x] **T0004-001 Add backend OpenAPI documentation and Swagger UI**

Add the compatible, explicitly pinned Spring MVC springdoc Swagger UI starter. Apply the documentation scope and DTO descriptions defined in spec.md and plan.md. Keep generated OpenAPI as the sole HTTP contract source of truth.

Add automated verification for the documentation endpoints where appropriate.
  Verify at minimum:

/v3/api-docs returns HTTP 200;

the generated document contains all Stone Catalog paths and methods, excludes endpoints outside the configured package/path scope, includes DTO and field descriptions, and documents only successful statuses matching implementation;

/v3/api-docs.yaml is available;

Swagger UI is reachable.

Run the complete backend verification required by the project.

After implementation, report:

dependency added;

configuration added, if any;

documentation URLs;

verification results.

Verification (2026-10-05): `./mvnw verify` and
`./mvnw verify -Dspring.profiles.active=openapi-verification` passed on JDK
23.0.2 with PostgreSQL 18.6 Testcontainers: 128 tests each, zero failures,
errors, or skips. Four new documentation tests cover JSON/YAML, Swagger UI,
catalog operations/statuses, and DTO descriptions/validation constraints.
Acceptance review is recorded in retrospective.md.
