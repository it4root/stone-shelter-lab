## Acceptance criteria

### AC-1 — Swagger UI is available

Given the backend application is running
When `/swagger-ui.html` is opened
Then Swagger UI is displayed successfully

### AC-2 — OpenAPI JSON is available

Given the backend application is running
When `/v3/api-docs` is requested
Then HTTP 200 is returned
And the response contains a valid OpenAPI document

### AC-3 — OpenAPI YAML is available

Given the backend application is running
When `/v3/api-docs.yaml` is requested
Then HTTP 200 is returned
And the response contains a valid OpenAPI document

### AC-4 — Stone API is documented

Given the Stone Catalog controller exists
When the generated OpenAPI document is inspected
Then all implemented Stone Catalog endpoints are present
And their HTTP methods and paths match the implemented controller

### AC-5 — DTO schemas are generated

Given controller operations use structured Request and Response DTOs
When the generated OpenAPI document is inspected
Then those DTOs are represented as OpenAPI schemas
And their validation constraints are reflected where supported
And all Request and Response DTOs, their fields, and nested types and fields have English descriptions supplied through `@Schema(description = ...)`

### AC-6 — HTTP statuses match implementation
Given an endpoint declares a non-default successful HTTP status
When the generated OpenAPI document is inspected
Then its documented successful response status matches the controller contract
And no error response statuses are documented

### AC-7 — Documentation scope

Given controllers exist in `lab.stoneshelter.controllers` or its subpackages
When the generated OpenAPI document is inspected
Then only their operations with paths matching `/api/**` are included
And future controllers matching both restrictions are included automatically
And Actuator endpoints are excluded

### AC-8 — Generated contract is the source of truth

Given the backend exposes OpenAPI JSON and YAML
Then both documents are generated from the implemented controllers and DTOs
And no separate handwritten OpenAPI contract is introduced or maintained

### AC-9 — Documentation is enabled in all profiles

Given the backend runs with any application profile
When Swagger UI, OpenAPI JSON, or OpenAPI YAML is requested
Then the documentation is available without profile-specific enablement
