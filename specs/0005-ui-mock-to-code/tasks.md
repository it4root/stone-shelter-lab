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
[ADR-0005](../../docs/adr/0005-ui-mock-to-code.md).

- [x] **T0005-009 — Add catalog pagination.** Default to 12 cards, offer up to
  24, return paginated metadata from the data source, implement accessible page
  controls and verify traversal, boundaries and page-size reset.

T0005-009 verification: lint, 6/6 component tests and production build passed.
Tests cover default size, complete traversal, boundary controls and size reset.

- [x] **T0005-010 — Keep four cards per desktop row.** Update the narrower
  desktop grid, preserve responsive tablet/mobile layout and run frontend checks.

T0005-010 verification: lint, 6/6 tests and build passed; local UI returned HTTP 200.

- [x] **T0005-011 — Extract frontend enum types.** Move StoneType, StoneSize
  and AdoptionStatus into separate files, update DTO and presentation types,
  run frontend checks and leave the local UI running.

T0005-011 verification: lint, 6/6 tests and build passed; local UI returned HTTP 200.

- [x] **T0005-012 — Apply accepted feature-oriented UI architecture.** Record
  ADR-0005, separate layout/page/hooks/domain/API DTOs/mocks, colocate styles,
  preserve existing behavior, verify frontend checks and leave UI running.

T0005-012 verification: lint, 6/6 tests and build passed. Chrome runtime checks
at 1440, 1024, 768, 390 and 320 pixels confirmed 12 initial cards, correct
4/4/2/1/1 column counts, two-line biographies and no horizontal overflow.
Desktop/mobile screenshots inspected; UI remains running at localhost:5174.

- [x] **T0005-013 — Permit explicit admissionDate backend sorting.** Expand
  request validation/generated descriptions, verify defaults, directions, ties
  and invalid inputs; run backend verification and check generated OpenAPI.
- [x] **T0005-014 — Implement the catalog sorting dropdown.** Add six options,
  order mocks before paging through the existing data boundary, reset page on
  sort changes, preserve page size/sort as specified and run frontend checks.
- [x] **T0005-015 — Verify sorting end to end within the mock scope.** Check
  responsive dropdown layout and acceptance criteria, record results and leave
  the local UI running. No live UI/backend integration is included.

T0005-013 verification (2026-10-06): Maven verify passed on JDK 23.0.2
with PostgreSQL Testcontainers via the active Docker Desktop socket. Explicit
admissionDate directions, omitted/null direction, id ASC ties and paginated
ordering verified. Existing invalid-input/name/size checks passed. Generated
JSON/YAML schema checks passed with the expanded whitelist. UI remains running
at localhost:5174; no frontend implementation or database migration in this task.

T0005-014 verification (2026-10-06): frontend lint, 13/13 tests and build passed.
Six ordering cases use shuffled, tied entries and timezone-offset timestamps;
tests verify global sorting before paging, ascending id ties and fixture
immutability. UI tests verify options, default order, resets and preserved size/sort.

T0005-015 verification (2026-10-06): Chrome checks at 1440, 1024, 768, 390
and 320 pixels confirmed 12 initial cards, 4/4/2/1/1 grid columns, two-line
biographies and no horizontal overflow. Desktop/mobile screenshots inspected.
Sorting acceptance criteria checked against frontend evidence and T0005-013's
128 passing backend tests and generated JSON/YAML checks. No live UI API calls
or database changes. Development server remains at localhost:5174 (HTTP 200).

## Completed Filter Tasks

- [x] **T0005-016 — Extend backend filter contract and implementation.** Add
  plural size/type and optional date bounds, preserve singular compatibility,
  update DTO/criteria/service validation/repository predicates and generated
  descriptions. Verify invalid inputs, UTC boundaries, group semantics, sorted
  pagination/totals and OpenAPI with PostgreSQL tests; run Maven verify.
- [x] **T0005-017 — Add mock filter support and feature state.** Introduce
  frontend filter DTOs, thread filters through the API boundary, filter before
  sorting/paging, manage applied filters/date drafts and page-reset semantics.
  Add meaningful tests and run frontend checks.
- [x] **T0005-018 — Build the responsive collapsible filter panel.** Add size/type
  multiselects, optional date inputs with accessible validation, group-count
  badge, toggle and reset. Use a feature slot in PageLayout, preserve common
  layout independence, add interaction tests and run frontend checks.
- [x] **T0005-019 — Verify filter acceptance and responsive integration.** Check
  keyboard access, desktop/tablet/mobile placement, empty results, expansion,
  reset, group counts and combined sorting/pagination. Record frontend/backend
  evidence, run required checks and leave the local UI server running.

Filter tasks are completed; verification evidence follows.

Filter verification (2026-10-06):

- T0005-016: Maven verify passed on JDK 23.0.2 with Docker Desktop PostgreSQL
  Testcontainers: 131 tests, zero failures/errors. Added plural-group, singular
  compatibility, duplicate/empty/null group, UTC day/open-bound, invalid enum/
  element/date/range and generated OpenAPI checks. No migration required.
- T0005-017: mock adapter filters before ordering/page slicing; tests cover OR/AND,
  counts, UTC bounds and compatibility. Feature state separates date draft/error
  from applied dates and derives active group count.
- T0005-018: responsive CatalogFilters added with accessible native controls,
  toggle/badge/reset, associated date errors and feature-provided layout slot.
  Frontend lint, 19/19 tests and production build passed.
- T0005-019: Chrome checks at 1440, 1024, 768, 390 and 320 pixels confirmed
  initial expanded/collapsed behavior, 4/4/2/1/1 columns and no overflow.
  Expanded tablet/mobile views, keyboard Space toggle and checkbox selection
  checked; desktop and narrow screenshots inspected. UI remains running at
  localhost:5174 (HTTP 200). No live backend integration was introduced.

- [x] **T0005-020 — Isolate service validation from HTTP error handling.**
  Add a custom date-range exception, translate it in ApiExceptionHandler, record
  the constitutional rule, enforce dependencies with ArchUnit and verify backend.

T0005-020 verification: Maven verify passed on 2026-10-06, 132 tests with no
failures/errors. Reversed-range HTTP 400 behavior remains covered; the new
ArchUnit protocol-dependency rule passes. UI remains at localhost:5174 (HTTP 200).

- [x] **T0005-021 — Compact catalog cards and default to eight per page.**
  Scale cards to 70%, offer 8/12/24, verify paging and responsive presentation,
  update documentation and leave UI running.

T0005-021 verification: lint, 20/20 tests and build passed. Chrome at 1440,
1024, 768, 390 and 320 pixels confirmed 8 initial cards, no overflow and
width/height ratios approximately 0.70 compared with the previous card scale.
Desktop/mobile screenshots inspected. UI remains running at localhost:5174.

- [x] **T0005-022 — Restore original card dimensions.** Remove grid scaling
  while retaining default size 8 and options 8/12/24; verify frontend checks
  and leave the local UI running.

T0005-022 verification: lint, 20/20 tests and build passed; original unscaled
grid CSS restored. Local UI remains at localhost:5174 (HTTP 200).

- [x] **T0005-023 — Replace collapse with fluid responsive sidebar.** Update
  shell/layout/feature composition, arrows/count, mobile overlay and state retention.
- [x] **T0005-024 — Verify sidebar accessibility and responsive behavior.**
  Check keyboard/modal/backdrop/reduced-motion behavior, tests and build, record
  acceptance evidence and leave the local UI running.

T0005-023/024 verification: frontend lint, 21/21 tests and build passed. Chrome
checks at 1440/1024/768/390/320 pixels verified initial state and no overflow.
Desktop catalog gains width when the sidebar hides and retains four columns.
Mobile modal/inert/scroll lock, focus trap/restore, Escape and backdrop closure
and reduced-motion zero transitions were verified. Screenshots inspected.
Selected filters survive reopening; reset now requires opening the panel.
Local UI remains running at localhost:5174. No backend changes or commits.

- [x] **T0005-025 — Audit UI decisions and consolidate the current stage.**
  Reconcile spec, plan and active acceptance descriptions with default 8,
  original cards, feature architecture and sliding sidebar. Record ADR-0005
  from initial image-to-code delivery through the current stage, preserving
  historical decisions and identifying superseded requirements.

T0005-025 verification: documentation links, task IDs and diff whitespace checked.
No runtime code changed; prior implementation evidence remains historical.

- [x] **T0005-026 — Consolidate UI ADRs into the feature-named record.**
  Merge current decisions, original architecture rules and historical catalog
  iterations into docs/adr/0005-ui-mock-to-code.md. Remove the three source ADRs
  and update repository references.

T0005-026 verification: obsolete references, local documentation links and diff
whitespace checked. Documentation-only change; no commit created.
