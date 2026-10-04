# 0003 — Tasks

## Contract

- [x] **T0003-001 — Check the initial Stone Catalog OpenAPI contract.**
    - Read:
        - `spec.md`
        - `acceptance.md`
        - `plan.md`
        - `docs/glossary.md`
  - Report any ambiguity or conflict in the requirements.

  
## Backend implementation

- [x] **T0003-002 — Propose controller methods — do not implement**
- [x] **T0003-003 — Add StoneCatalogController and API DTO skeletons**
  - Add the agreed create, get, search, update and delete signatures.
  - Keep method bodies unimplemented: throw UnsupportedOperationException.
  - Use separate request and response DTOs; searchTerm is out of scope.
  - [x] Add domain enums and request validation for required fields, length limits,
    admission timestamps, pagination and sorting; add the validation starter.
  - [x] Add a temporary ProblemDetail handler for unimplemented operations.
  - [x] Replace unsupported-operation tests with forward-looking API behavior
    tests covering validation, CRUD, search, pagination, sorting and edge cases.
  - [x] Remove package-info.java files and use explicit controller imports;
    document the explicit-import rule in the constitution.


