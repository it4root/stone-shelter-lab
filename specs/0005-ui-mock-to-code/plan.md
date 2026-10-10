# Implementation Plan

Use the existing React, TypeScript and Vite stack without additional dependencies.

## Data
Started the backend and PostgreSQL through Docker Compose
Use the generated YAML snapshot , specifically
`StoneSearchResponse`, as the reference for local mock entries. Keep 30 entries in the local dataset and expose contract-shaped pages through
the data source, with a UI/mock default size of 8 and a maximum of 24. No network requests or mock HTTP server are needed.
Use the contract enum values for stone types, sizes and adoption statuses.
Store the supplied placeholder under the UI public directory.

## Presentation

Build a static header and a responsive catalog grid with CSS. Render the current page of local
entries. Use a sliding filter sidebar and reserve desktop space for future chat; reclaim that
space on small screens. Use the provided image as the visual reference.
Clamp biographies to two lines. Keep excluded controls out of the UI.

## Verification

Run lint, Vitest and production build after each implementation task. Verify
catalog content and missing-photo fallback with component tests when rendering
is implemented. Check representative desktop, tablet and mobile widths visually
in the final verification task.

## Component Architecture and Pagination

Follow the consolidated [ADR-0005](../../docs/adr/0005-ui-mock-to-code.md).
App composes Header, CatalogPage and Footer. CatalogPage connects useCatalog to
Common/PageLayout, FilterSidebar, feature controls and the domain StoneCard.
Each component has a PascalCase directory; colocate CSS and component tests.
Use explicit presentation maps and separate named enum files under src/enums.

useCatalog owns local state. The synchronous api/stonesApi boundary delegates
to mocks/api; fixtures live in mocks/data and DTOs in api/dto. Components do not
import fixtures. No forwarding service, store, router or live HTTP client is needed.
The adapter returns StonesSearchResponse metadata; pagination renders this metadata.
Default to 8, offer 8/12/24, cap at 24 and reset page on size changes. Backend
omitted-size default remains 12. Verify traversal and boundary controls.

Keep original unscaled cards: four columns from 960 pixels, two at 560–959,
one below 560. Preserve two-line biographies and missing/broken image fallback.

## Sorting Extension

Use existing admissionDate; no persistence migration. Expand SearchSort field
validation/descriptions; reuse the existing StoneSortField and repository date
ordering. Verify generated OpenAPI and backend ordering with the existing
PostgreSQL Testcontainers approach.

Implement a feature-owned sorting component and separate selectable sort type.
Map options explicitly to field/direction. useCatalog owns sort alongside page
and size; adapters receive sort parameters. Sort a copy of mock entries before
slicing, preserve fixtures, and use id ASC for ties. Add interaction/order tests
with shuffled/tied data so they detect ordering defects rather than merely
matching the fixture's existing insertion order. Run frontend checks, backend
verification, responsive inspection and leave the dev server running.

## Filter Extension Plan

Keep backward-compatible singular filters; add plural arrays and LocalDate bounds
to StoneSearchFilter as a class, annotate constraints and generated descriptions.
Validate cross-field date order in the service, extend criteria with plural
values and UTC bounds, and build repository predicates before existing ordering
and pagination. Test PostgreSQL boundary dates, group semantics, invalid input,
compatibility, counts and generated JSON/YAML using existing infrastructure.

Add a feature-owned CatalogFilters component, DTOs and explicit type/size labels.
useCatalog owns applied filters, separate date drafts/errors and panel state.
The mock adapter filters a copy before existing sorting/pagination. PageLayout
accepts a feature-provided filter slot; it handles responsive placement only.
Retain accessible native controls and existing dependencies. Tests include
shuffled fixture data, UTC/day-offset boundaries, invalid draft retention, group
count, reset, expansion and pagination/sort interactions. Verify responsive
layout at desktop/tablet/mobile sizes and leave the local UI server running.

Replace the service ResponseStatusException with InvalidAdmissionDateRangeException
and centralize its HTTP 400 translation in ApiExceptionHandler. Extend architecture
checks to forbid HTTP/protocol error dependencies in services and custom exceptions.

Use a shared Common/FilterSidebar shell for layout, translation, toggle/backdrop
and accessibility; feature CatalogFilters renders filter fields/reset only.
PageLayout accepts sidebar-open state for fluid desktop tracks. CatalogPage
connects feature state to shell. Use matchMedia for viewport mode and native
inert for hidden/background content. Add modal focus handling, scroll lock and
reduced-motion CSS without dependencies.
