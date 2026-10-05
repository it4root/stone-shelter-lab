# Backend OpenAPI documentation

## Goal

Expose automatically generated OpenAPI documentation for the backend REST API and provide an interactive Swagger UI page.

The generated OpenAPI document is the source of truth for HTTP API contracts. Generate it from the implemented Spring MVC controllers and shared DTOs. Do not maintain a separate handwritten OpenAPI contract. HTTP behavior requirements are specified before implementation; the generated document must reflect that implementation.

## Requirements

The backend must expose:

- Swagger UI;
- OpenAPI JSON;
- OpenAPI YAML.

Expected endpoints:

```text
/swagger-ui.html
/v3/api-docs
/v3/api-docs.yaml
```

Swagger UI must describe the actual implemented controller endpoints, request DTOs, response DTOs, validation constraints and successful HTTP response statuses.

API documentation must not introduce a second independently maintained API model.

Do not duplicate controller contracts in a manually maintained OpenAPI specification.


## Documentation scope

- Enable Swagger UI, OpenAPI JSON, and OpenAPI YAML in all application profiles.

- Include only controller operations in `lab.stoneshelter.controllers` and its subpackages whose paths match `/api/**`.
- Include all implemented Stone Catalog operations and automatically include future controllers within that package and path scope.
- Exclude Actuator and other endpoints outside this scope.
- Add English `@Schema(description = ...)` annotations to all shared Request and Response DTOs, their fields, and their nested types and fields.
- Document only successful HTTP response statuses. Do not document error responses for this feature or alter runtime error handling.
