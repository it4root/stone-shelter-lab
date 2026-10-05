Add backend OpenAPI documentation and Swagger UI
Add `org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1`, pinned in ADR-0001, for Spring MVC.
Use a version compatible with the current Spring Boot version. Do not downgrade Spring Boot or other project dependencies to accommodate springdoc.
The generated OpenAPI document is the source of truth for HTTP contracts and must be generated from the implemented Spring controllers and DTOs.
Do not introduce or maintain a separate handwritten OpenAPI YAML contract.

Constraints

Do not change existing controller API behavior merely to improve generated documentation.

Do not redesign existing Request or Response DTOs.

Do not introduce duplicate documentation models.

Add English `@Schema(description = ...)` annotations to all shared Request and Response DTOs, their fields, and nested types and fields. Preserve DTO structures and runtime behavior.

Restrict generation using both package scanning for `lab.stoneshelter.controllers` (including subpackages) and path matching for `/api/**`. Future matching controllers must be included automatically. Exclude Actuator.

Document only successful response statuses, matching controller behavior. Prevent inferred error responses from appearing in the document without changing exception handling.

Keep configuration minimal. Enable Swagger UI and OpenAPI endpoints in all application profiles; do not introduce profile-specific restrictions.
