# ADR-0005: UI Mock to Code

- Date: 2026-10-06
- Status: Accepted
- Feature: [0005-ui-mock-to-code](../../specs/0005-ui-mock-to-code/spec.md)
- Acceptance: [acceptance.md](../../specs/0005-ui-mock-to-code/acceptance.md)
- Related: [ADR-0004](0004-generated-openapi.md)

## Context

The catalog began as a React implementation of the supplied catalog.png. Scope
expanded through explicitly accepted iterations: component extraction, pagination,
feature architecture, sorting, filters and a fluid responsive sidebar. Earlier
append-only documents retained requirements that later decisions replaced.
This ADR consolidates the accepted current stage and preserves that history.
The current decisions below supersede outdated product/layout details in the
historical catalog record. The original feature architecture rules are preserved
in the architecture appendix and remain accepted. No new feature is
approved by this consolidation.

## Decision

### Visual reference and scope

Use [catalog.png](../../specs/0005-ui-mock-to-code/catalog.png) for the light
background, green accents, spacing, rounded cards and overall visual direction.
Agreed behavior takes precedence over decorative or excluded mockup controls.
Independently adapt mobile/tablet without requiring another mockup. Application
labels and mock biographies are English. Header labels are static: Stone catalog,
How it works, About the shelter, Blog and Contact. Footer is a separate semantic
component with ©, the current year and Stone Shelter; no links are required.
Reserve desktop space for a future chatbot and reclaim unused space on narrow
screens. Chatbot, favorites/hearts, adoption, detail actions and working navigation
remain outside scope. Sorting and filters were explicitly brought into scope.

Cards show photo, name, size, type and biography. Use backend stoneType for the
requested breed, with explicit English enum labels. Clamp biographies to two
lines; missing biographies use an English fallback. Missing or broken photos
use the supplied placeholder-rock.png. Remove the filename's leading space;
preserve the supplied bitmap, including embedded Russian text, unchanged as the
explicit asset exception. Do not add invented API fields for mockup decoration.

### Mock data and API boundary

Keep exactly 30 contract-compatible stones, prepared using generated backend
OpenAPI YAML. Generated /v3/api-docs and /v3/api-docs.yaml are the only HTTP
contract source of truth; no handwritten contract or mock HTTP server is needed.
The UI starts without a backend and uses a synchronous API boundary delegating
to a mock adapter. Components never import fixtures directly. Responses retain
content, page, size and totalElements. Apply filtering, then deterministic sorting,
then page slicing; totals count all matching stones. Do not mutate fixtures.
Live UI/backend integration remains outside scope despite backend contract work.

### Components, state and future layers

Every component has its own PascalCase directory and matching implementation
filename. Shared grouping uses PascalCase Common. Current responsibility map:

| Location | Responsibility |
| --- | --- |
| src/App | Top-level composition of Header, CatalogPage and Footer |
| src/components/Common | Header, Footer, PageLayout, Pagination, FilterSidebar |
| src/features/catalog/components | CatalogPage, Catalog, CatalogSort, CatalogFilters |
| src/features/catalog/hooks | useCatalog and local orchestration/state |
| src/features/catalog/presentation and validation | Sort mappings and date validation |
| src/domain/stone | StoneCard and explicit presentation labels |
| src/api and api/dto | API boundary and contract DTOs |
| src/enums | Each enum as a separate named type in a PascalCase file |
| src/mocks/data and mocks/api | Fixtures and mock search implementation |
| src/styles | Global styles and design tokens |

CatalogPage replaces the earlier Content component. Colocate component CSS and
component tests. Common components do not own catalog data or filtering logic.
FilterSidebar owns generic layout/accessibility; CatalogFilters owns fields/reset.
useCatalog owns page, size, sort, applied filters, date drafts/errors and sidebar
state. Derive totals and group count instead of duplicating state. Use explicit
presentation mappings; preserve backend enum values without generic formatting.

Follow the architecture appendix for future feature services/state, application providers/routing
and API clients. Add them only when a real authorized requirement needs them.
Services own application logic, never only forward calls. Keep local state local;
separate server data from shared client state. Do not create empty future layers,
a global store or dependencies merely to implement a proposed directory tree.

### Cards and pagination

Keep original unscaled cards. Desktop from 960 pixels has four columns, tablet
560–959 has two and narrower mobile has one, without horizontal page scrolling.
Default UI/mock page size is 8; choices are exactly 8, 12 and 24, maximum 24.
Backend omitted-size default stays 12. Thirty unfiltered stones at size 8 produce
pages of 8, 8, 8 and 6. Use zero-based state and one-based numbered controls;
Previous/Next disable at boundaries. Totals come from response metadata.
Changing size resets to page 1 and retains sorting/filtering.

### Sorting and admission date

The accessible dropdown beside the heading offers:

| Label | Field | Direction |
| --- | --- | --- |
| Newest first (default) | admissionDate | desc |
| Oldest first | admissionDate | asc |
| Name: A–Z | name | asc |
| Name: Z–A | name | desc |
| Size: small to large | stoneSize | asc |
| Size: large to small | stoneSize | desc |

Size order is SMALL, MEDIUM, LARGE. Dates sort chronologically; names preserve
existing backend semantics without new locale/case normalization. Always break
ties with id ascending. Changing sort resets page while retaining size/filters.
Date added and admission date both mean the existing client-supplied admissionDate;
do not introduce createdAt, a database column or a migration.

Backend search accepts explicit admissionDate along with name and stoneSize.
Absent/null field defaults to admissionDate; absent/null direction defaults to
desc for admissionDate and asc for name/stoneSize. Invalid fields/directions
remain HTTP 400 ProblemDetail. Keep one sort criterion and existing routes/statuses.

### Filter semantics and validation

Use checkbox multiselects for three sizes and all ten contract stone types, plus
optional From/To admission dates. OR within each group; AND between groups.
Empty/null groups do not restrict results. Apply valid changes immediately.
Date bounds use YYYY-MM-DD and inclusive UTC days: From midnight inclusive,
To's next midnight exclusive. Either endpoint alone and equal endpoints work;
no new future-date restriction applies to search bounds.

Malformed/nonexistent dates and From after To produce accessible English errors.
Invalid drafts retain last applied dates/results/page; size/type changes still
apply with last valid dates. Count applied groups, not selected values: sizes,
types and either date endpoint each contribute one, maximum three. Invalid
drafts do not change that count. Valid filter changes reset page, preserving
sort/size. Reset clears filters, drafts/errors and returns to page 1 while retaining
sort, size and sidebar state. Empty results display an English message, zero
total, no numbered pages and disabled Previous/Next; sidebar remains reopenable.

Extend POST /api/v1/stones/search with optional nullable stoneSizes, stoneTypes,
admissionDateFrom and admissionDateTo. Preserve singular stoneSize/stoneType and
adoptionStatus as additional AND constraints. Duplicates have no effect; conflicting
singular/plural values produce zero matches. Unknown enums, null array members,
invalid dates and reversed bounds return HTTP 400 RFC 9457 ProblemDetail.
Generated OpenAPI describes these semantics. No schema migration is required.

StoneSearchFilter has more than four fields and is a class with private fields,
no-argument constructor and getters/setters. Controllers bind/validate requests;
services validate cross-field order and prepare criteria; repositories own
predicates, ordering and Pageable queries. Services throw protocol-independent
InvalidAdmissionDateRangeException; ApiExceptionHandler translates it to 400.
The constitutional service/exception protocol boundary is enforced by ArchUnit.

### Fluid responsive sidebar

Desktop initially opens the left sidebar. Closing slides the whole panel left;
the catalog uses freed width and keeps four columns. A Filters opener with arrow
and active-group badge remains visible. Reset stays inside the panel.

Tablet/mobile initially hide it. Opening shows a left sliding modal overlay with
backdrop; close with arrow, backdrop or Escape. Move focus inside, trap keyboard
focus, make background inert, lock background scrolling and restore opener focus
on close. Desktop is nonmodal. Hidden controls cannot receive focus. Resize
changes presentation while retaining open state and values. Opening/closing does
not alter applied filters, drafts/errors, pagination, sorting or page size.
Animate translation and desktop layout; honor prefers-reduced-motion.

### Delivery and verification

Keep acceptance exclusively in acceptance.md; spec links to it. Use task IDs
T0005-NNN. All repository artifacts are English. Run meaningful frontend lint,
tests/build and responsive checks for UI changes; backend changes also require
PostgreSQL integration, generated-contract and architecture checks. Keep the local
UI running after frontend verification unless explicitly asked otherwise.
Do not commit or push without an explicit request. Authorized UI/backend commit
subjects start with the exact current spec folder, e.g. 0005-ui-mock-to-code;
ask for the spec folder if context does not identify it.

## Evolution and Superseded Decisions

| Stage | Accepted change | Current disposition |
| --- | --- | --- |
| Initial image-to-code iteration | Static header, 30 mock cards, reserved filter/chat spaces | Pagination and implemented filters replace the initial all-card/filter-placeholder behavior |
| Component extraction | Header, Content, Catalog, StoneCard and Footer; named folders/Common | Feature architecture replaces Content with CatalogPage and PageLayout |
| Pagination | Default 12, options 12/24; four desktop columns | Four columns retained; default/options replaced by 8 and 8/12/24 |
| Architecture iteration 2 | Feature/domain/API/mock boundaries | Retained; future service/store layers remain conditional |
| Sorting | Six choices; existing admissionDate accepted explicitly by backend | Retained |
| Filters | Multiselect/date groups; field-only collapse; collapsed reset visible | Matching retained; sliding sidebar replaces collapse and reset placement |
| Compact-card experiment | 70% scale and default 8 | Scaling explicitly reverted; default 8 retained |
| Restoration | Original full card dimensions | Retained |
| Current sidebar | Fluid desktop layout and narrow modal overlay | Current behavior |

## Consequences

The specification now describes one current behavior rather than contradictory
historical requirements. The historical appendix and task/test records retain
iteration evidence; the architecture appendix retains the architecture rationale. Mock-first delivery keeps UI review
independent of backend availability, while API parity limits later integration
work. A service/store or real HTTP implementation still requires its own documented
scope. The retained placeholder has an intentional language exception. Modal
sidebar accessibility requires continued keyboard and responsive verification.

## Verification Evidence

Existing implementation evidence is in acceptance.md and tasks.md: frontend lint,
21 tests and build passed; Chrome checks at 1440/1024/768/390/320 pixels covered
sidebar layout, focus, backdrop/Escape, inert/scroll lock and reduced motion.
Backend verification passed 132 tests, including PostgreSQL, generated OpenAPI
and architecture checks. These are recorded prior implementation results; this
ADR introduces documentation changes only and does not claim a new runtime run.

## Architecture Appendix: Original Accepted Rules

The following record preserves the original architecture rules. Its references
to the pre-refactoring state describe that iteration; the current decisions above
define implemented components and state. Proposed future files remain conditional.

## ADR 0006: Feature-oriented React architecture

Date: 2026-10-05

Status: Accepted by the user before implementation of T0005-012.

### Context

The catalog needs an organization that supports future services, server data and
shared client state. Common/Content currently owns catalog pagination and data
access, mixing shared layout and feature behavior. The user accepted the proposed
structure and requested refactoring under these rules.

### Decision

Organize UI by feature, keeping related components, hooks, services and state
near each other. Keep reusable domain UI separate from feature-specific UI.
Each component retains its own PascalCase directory with implementation, styles
and tests colocated where applicable.

The accepted target structure is:

```text
src/
├── App/
│   ├── App.tsx
│   ├── App.test.tsx
│   ├── providers/
│   └── store/
├── components/
│   └── Common/
│       ├── Header/
│       ├── Footer/
│       ├── PageLayout/
│       └── Pagination/
├── features/
│   └── catalog/
│       ├── components/
│       │   ├── CatalogPage/
│       │   └── Catalog/
│       ├── hooks/
│       │   └── useCatalog.ts
│       ├── services/
│       │   └── catalogService.ts
│       └── state/
│           └── catalogReducer.ts
├── domain/
│   └── stone/
│       ├── components/
│       │   └── StoneCard/
│       └── presentation/
│           └── stoneLabels.ts
├── api/
│   ├── httpClient.ts
│   ├── stonesApi.ts
│   └── dto/
│       ├── StoneSearchResponse.ts
│       └── StonesSearchResponse.ts
├── enums/
│   ├── StoneType.ts
│   ├── StoneSize.ts
│   └── AdoptionStatus.ts
├── mocks/
│   ├── data/
│   │   └── stones.ts
│   └── api/
│       └── mockStonesApi.ts
└── styles/
    ├── global.css
    └── tokens.css
```

Create folders/files only when they have an implemented responsibility. The
structure reserves architectural locations, not permission to implement future
features or add dependencies.

| Layer | Responsibility |
| --- | --- |
| CatalogPage | Compose the screen and connect data/actions to UI |
| Catalog, StoneCard | Render props and invoke callbacks |
| useCatalog | Own pagination parameters and, when asynchronous fetching exists, loading/error state |
| catalogService | Application operations requiring processing or multiple requests |
| stonesApi | Data-access boundary returning contract DTOs; HTTP when backend integration is implemented |
| httpClient | Shared HTTP configuration, status handling and ProblemDetail handling when HTTP exists |
| mocks/api | Substitute the data source; components do not know about fixtures |

Common PageLayout handles placement only. It does not own catalog data or state.
App only composes the top-level structure. UI components do not directly import
mock datasets. API DTOs remain separate from fixtures and domain enum types.
Keep explicit enum presentation mappings in domain/stone/presentation.

Services are not mandatory forwarding layers. A hook can call the API directly
for one simple operation. Add a service only when it owns application logic;
do not duplicate backend business rules in frontend services.

#### State Rules

- Keep state near its consumers. Avoid redundant state and do not store values
  that can be derived from existing state or response metadata.
- For the current catalog, keep page and size in useState inside useCatalog.
  Do not add a global store for these two local values.
- As feature transitions become more complex, use useReducer. Add Context when
  distant consumers need the same state. A custom hook shares logic, not a
  singleton state instance.
- Separate server state from client UI state. On backend integration, choose
  TanStack Query for server data, or RTK Query if Redux Toolkit is selected.
  Do not maintain duplicate copies of server data in a client store.
- When shared client state requires a store, keep feature slices with features
  and assemble the store and providers under App/store and App/providers.
- After routing is introduced, consider URL state for page, size and filters
  so links can be shared and browser Back restores navigation.

For this refactoring, split PageLayout and CatalogPage, isolate DTOs and mocks,
extract useCatalog, move styles beside components and introduce shared CSS tokens.
Retain synchronous local pagination, all existing behavior and the existing
stack. Do not implement HTTP, new providers, services, stores or routing yet.

### Consequences

Layout is reusable without catalog dependencies. Feature logic, DTOs, mocks and
presentation each have a defined location. Future HTTP and store integration
have explicit boundaries without speculative implementation today.

This supersedes the historical catalog record's placement of Content under Common and Catalog and
StoneCard directly under components. Existing enum and PascalCase rules remain.
Mock API selection is local-only until backend integration is specified.

### Alternatives considered

- Global folders for all hooks/services/state: rejected in favor of feature cohesion.
- Keep catalog behavior in Common/Content: rejected because it couples layout to a feature.
- Add a global store or service for every API operation now: deferred until needed.
- Add a query library before HTTP integration: deferred until server state exists.

### References

- [Redux Style Guide](https://redux.js.org/style-guide/): feature-based organization.
- [React state structure](https://react.dev/learn/choosing-the-state-structure): avoid redundant state.
- [React custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks): reuse stateful logic.
- [React reducer and context](https://react.dev/learn/scaling-up-with-reducer-and-context): scale shared state.
- [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview): server-state lifecycle.

## Historical Appendix: Catalog Iterations

The following record preserves the original catalog decisions and amendments.
Superseded defaults, component locations, compact scaling and collapse behavior
are historical only; the current Decision section governs implementation.

## ADR 0005: Mock-driven catalog UI and component organization

Date: 2026-10-05

Status: Accepted by the user during feature 0005 and its subsequent refactoring.

### Context

[Feature 0005](../../specs/0005-ui-mock-to-code/spec.md) implements an initial
responsive stone catalog from a desktop image. The user requested local mock
startup, a limited catalog scope, separate components and consistent directory
naming. The UI must follow the backend contract without requiring a running
backend or adding speculative features.

### Decision

- Retain the existing React, TypeScript and Vite stack and use CSS for layout.
  Add no UI framework, mocking library or other dependency for this iteration.
- Use the generated backend OpenAPI YAML snapshot as the source for mock field
  names, enum values and types, following [ADR-0004](0004-generated-openapi.md).
  Provide 30 local entries as a collection, not an oversized API-shaped page.
  No live API calls, mock HTTP server or endpoint changes are required.
- Keep API types outside the mock dataset. Components obtain entries through
  the catalog data-source boundary. App only composes the application structure.
- Use explicit English display mappings for API enums rather than generic
  string formatting. Show name, type, size and a two-line biography per card.
- Use the supplied `placeholder-rock.png` for missing photos and as a fallback
  for failed photo loads. Preserve the selected bitmap, including its embedded
  Russian text; application labels and mock text are English.
- Keep header navigation as static English labels. Favorites, adoption, details,
  filtering, sorting, pagination behavior and chatbot functionality are outside
  this iteration. Reserve side space for future filters and chat on desktop;
  reclaim that space on tablet and mobile.
- Adapt the reference independently for smaller screens. Use four catalog
  columns on wide desktop, three on narrower desktop, two on tablet and one
  on mobile. Do not introduce horizontal page scrolling.
- Separate Header, Footer, Content, Catalog and StoneCard. Footer contains only
  copyright with the current year and Stone Shelter.
- Use PascalCase component names, filenames and component/group directories.
  Each implementation lives at `{ComponentName}/{ComponentName}.tsx`.
  Place Header, Footer and Content under `src/components/Common`, Catalog and
  StoneCard under `src/components`, and App with its CSS/tests under `src/App`.
- Keep feature acceptance criteria exclusively in the sibling `acceptance.md`,
  linked from `spec.md`. Use task IDs `T{specNumber:04d}-{taskNumber:03d}` across
  the repository, such as `T0005-001`, preserving IDs when adding tasks.

### Consequences

The catalog starts independently of backend infrastructure. The data-source
boundary separates mock fixtures from rendering, while API types and explicit
labels remain reusable. Generated-contract changes must be reflected in local
UI types and fixtures; this iteration does not automate type generation.

The component directory structure makes responsibilities explicit and keeps
shared page elements together. Static navigation and reserved side areas provide
only the agreed layout; future interactive features require their own specs.
The supplied placeholder is a known exception to English text within images.

### Alternatives considered

- Connect to a live backend immediately: excluded by the local mock scope.
- Add an HTTP mocking framework: unnecessary for a local data-source boundary.
- Put types and mock data directly in App or reusable components: rejected in
  favor of composition and separation at the data-source boundary.
- Keep all components in App or a flat component directory: replaced by named
  directories and the Common group at the user's request.
- Implement controls visible in the reference image: excluded by agreed scope.
- Translate or replace the selected placeholder bitmap: not requested.

### Amendment: Catalog Pagination

On 2026-10-05 the user included pagination in scope: 12 cards by default and
a maximum of 24 per page. This supersedes the original collection-only decision
and pagination exclusion. The mock data source now returns the generated
StonesSearchResponse structure, and the UI uses its totalElements, page and size
metadata. Offer sizes 12 and 24, reset to the first page on size change and keep
the existing backend page-size constraints. No new dependency or live API call.

### Amendment: Desktop Column Count

The user requested four cards per row. Desktop now retains four columns at
960 pixels and above, superseding the three-column narrower-desktop decision.
Tablet and mobile keep two and one columns respectively.

### Amendment: Dedicated Frontend Enum Types

Define each frontend enum as a named type in its own PascalCase file under
src/enums. StoneType, StoneSize and AdoptionStatus retain the generated backend
values. DTOs and presentation mappings import these types; mock fixtures retain
their existing values. Use type unions without introducing runtime enum objects.

### Amendment: Catalog Sorting

On 2026-10-06 the user accepted six explicit dropdown options: chronological
newest/oldest, name ascending/descending and domain size ascending/descending.
The date is the existing client-supplied admissionDate, also called date added
or admission date. No createdAt field or migration is required.

The backend search whitelist now permits admissionDate explicitly alongside
name and stoneSize; generated OpenAPI remains the contract source. The UI
defaults to Newest first and passes field/direction through the API boundary.
The mock adapter sorts a copy of the complete dataset before paging, using
id ASC for ties in both directions. Sort changes reset page and preserve size;
page/size changes preserve sort. This supersedes the initial sorting exclusion.
The dropdown is feature-owned and uses separate named enum types and explicit
presentation mappings. No new dependency or live HTTP integration is added.

### Amendment: Catalog Filters

The user accepted size/type multiselects and optional admission-date bounds,
with OR inside groups and AND between groups. Count active applied groups (0–3),
not selections. The date range counts as one group even with only one bound.
Use inclusive UTC calendar days, retain the last valid applied range when a
draft is invalid and show associated validation errors. Filter before sorting
and pagination; totals reflect matches. Reset preserves sort, size and expansion.

A feature-owned collapsible panel occupies the desktop side area and appears
above the catalog collapsed initially on tablet/mobile. PageLayout receives the
feature panel as a slot and retains no filter state. Native accessible controls
and local feature state suffice; no dependency or global store is introduced.

The backend adds plural filters and optional LocalDate bounds while preserving
singular size/type/adoption-status filters with AND semantics. StoneSearchFilter
is a class because it now exceeds four fields. The service validates date order
and translates UTC bounds; repositories build query predicates. Generated
OpenAPI remains the only HTTP contract. No schema change or migration is needed.
These decisions supersede the initial reserved-only filter area and filter scope
exclusion. UI continues using the mock API boundary.

### Amendment: Compact Cards and Eight-Card UI Default

The user requested cards 30% smaller and an initial page size of 8 with options
8/12/24. The grid uses 70% width with layout-aware 0.7 CSS zoom to preserve card
proportions and responsive column counts. The local UI/mock default changes to
8; backend omitted-size default stays 12 because UI sends its chosen size.
This supersedes the previous UI default of 12 without changing the maximum 24.

### Amendment: Restore Original Card Dimensions

The user reverted the compact-card visual change. Remove the 70% grid width
and CSS zoom; restore full-size cards. Keep the UI/mock default 8 and options
8/12/24. This supersedes only the preceding compact-scale decision.

### Amendment: Sliding Responsive Filter Sidebar

The user replaced field-only collapse with a full sliding sidebar. Desktop
uses an animated grid track so closing frees catalog width while retaining
four columns. A Filters/count/arrow opener remains visible. Tablet/mobile use
a left modal overlay with backdrop, Escape closure, focus containment/restoration,
inert background and scroll locking. Hidden controls are inert; reduced motion
disables transitions. Filter selections/drafts and catalog parameters survive
toggles. Reset stays inside the sidebar, superseding collapsed-visible reset.

Common/FilterSidebar owns presentation/accessibility; feature state and fields
remain in useCatalog/CatalogFilters. PageLayout accepts the shell and toolbar
slots with open state and owns responsive tracks. No dependency was introduced.
