# ADR 0004: Generated OpenAPI as the HTTP contract source of truth

Date: 2026-10-05

Status: Accepted by the user before implementation of T0004-001.

## Context

The [backend documentation feature](../../specs/0004-add-swagger-api/spec.md)
requires Swagger UI and generated OpenAPI JSON/YAML. Existing repository rules
required contracts before implementation, leaving ambiguity about maintaining a
handwritten contract. The user resolved this and the documentation scope before
implementation.

## Decision

- The generated OpenAPI document is the source of truth for HTTP API contracts.
  Specify HTTP behavior requirements before implementation, then generate the
  contract from Spring MVC controllers and shared DTOs. Do not maintain a
  separate handwritten contract or duplicate documentation models.
- Use `org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1`. The version
  rationale and existing Spring Boot/JDK pins are recorded in [ADR-0001](0001-stack-versions.md).
- Add English `@Schema(description = ...)` annotations to every shared Request
  and Response DTO, its fields, and nested types and fields. Preserve DTO
  structures, validation, and runtime API behavior.
- Include operations only when their controller belongs to
  `lab.stoneshelter.controllers` or a subpackage and their path matches `/api/**`.
  Include Stone Catalog and future matching controllers automatically.
  Exclude Actuator and endpoints outside these restrictions.
- Document only successful HTTP statuses. Set
  `springdoc.override-with-generic-response=false` to prevent inferred
  controller-advice responses from being added. Preserve runtime error handling.
- Enable Swagger UI and OpenAPI in all application profiles. Keep the package,
  path, and response-generation settings in the shared `application.yaml`.
- Expose `/swagger-ui.html`, `/v3/api-docs`, and `/v3/api-docs.yaml`.


## Consequences

Controller and DTO changes automatically appear in the published contract.
Specifications still define intended behavior before coding; verification checks
that generated documentation matches the implemented API. Descriptions live
with DTOs, avoiding a second maintained model.

Error responses are intentionally absent from this feature's documentation,
although the API continues to return its existing ProblemDetail errors.
Swagger remains available in every profile, as selected by the user.

## Alternatives considered

- Maintain a handwritten OpenAPI contract: rejected in favor of generation.
- Document error statuses: excluded by the user's selected scope.
- Include Actuator or all application endpoints: rejected in favor of package
  and `/api/**` restrictions.
- Enable documentation only locally: rejected; all profiles were requested.
