# Tasks: Feature 0005

Task IDs follow `T{specNumber:04d}-{taskNumber:03d}` across the repository.
Completed tasks are checked below. Execute only tasks authorized by the user;
do not create commits or push unless explicitly requested.

## Completed Tasks

- [x] **T0005-001 — Prepare contract-compatible mock data and the placeholder.**
  Created exactly 30 uniquely identified stones from the generated backend YAML
  schema. Renamed the supplied placeholder without a leading space and copied
  it to the UI public directory. Checked count, identifiers and enum values.
- [x] **T0005-002 — Implement UI iteration 1.**
  Built the static English header and catalog following `catalog.png`. Cards
  show name, type, size and biography with missing-photo fallback. Reserved
  desktop space for future filters and chat. Excluded action controls.
  Committed iteration 1 as `f4457cb` when explicitly requested.
- [x] **T0005-003 — Verify responsive rendering.**
  Inspected Chrome screenshots at 1440×1000, 768×1024, 390×844 and 320×800.
  Runtime checks confirmed 30 cards, biographies limited to two lines and no
  horizontal overflow. Fixed minimum-width overflow at 320 pixels.
- [x] **T0005-004 — Extract components and isolate the data boundary.**
  Extracted Header, Content, Catalog and StoneCard; added Footer with current-year
  copyright. App only composes page components. Moved API types out of mocks,
  introduced the catalog data source and explicit enum presentation mappings.
- [x] **T0005-005 — Give every component its own named directory.**
  Moved component implementations into their respective directories, keeping
  App, its stylesheet and its tests together. Updated imports.
- [x] **T0005-006 — Standardize shared component naming.**
  Renamed the shared group to Common. Grouped Header, Footer and Content there.
  Documented PascalCase component and directory naming in frontend AGENTS.md.
- [x] **T0005-007 — Start and verify the local UI.**
  Started Vite at `http://localhost:5174/` because port 5173 was occupied.
  Confirmed HTTP 200 and supplied the local link. This records the completed
  startup check; it does not guarantee that the development process stays running.
- [x] **T0005-008 — Reconcile task records and document decisions.**
  Consolidated completed work in this checklist, standardized full task IDs,
  recorded naming rules in root AGENTS.md and accepted UI decisions in ADR-0005.

## Verification Records

- T0005-001: dataset checks, lint, the existing test (1/1) and build passed.
- T0005-002: lint, four component tests and build passed.
- T0005-003: responsive visual/runtime checks, lint, 4/4 tests and build passed.
- T0005-004 through T0005-006: lint, 4/4 existing tests and build passed after
  each requested refactoring.
- T0005-007: the local Vite server returned HTTP 200.
- T0005-008: documentation references, task ID consistency and diff whitespace
  checked. No runtime code changed; previous frontend results remain applicable.

Acceptance criteria and their verification evidence live in
[acceptance.md](acceptance.md). Technical decisions are recorded in
[ADR-0005](../../docs/adr/0005-ui-catalog-structure.md).

- [x] **T0005-009 — Add catalog pagination.** Default to 12 cards, offer up to
  24, return paginated metadata from the data source, implement accessible page
  controls and verify traversal, boundaries and page-size reset.

T0005-009 verification: lint, 6/6 component tests and production build passed.
Tests cover default size, complete traversal, boundary controls and size reset.

- [x] **T0005-010 — Keep four cards per desktop row.** Update the narrower
  desktop grid, preserve responsive tablet/mobile layout and run frontend checks.

T0005-010 verification: lint, 6/6 tests and build passed; local UI returned HTTP 200.
