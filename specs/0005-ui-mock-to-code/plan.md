# Implementation Plan

Use the existing React, TypeScript and Vite stack without additional dependencies.

## Data

Use the generated YAML snapshot `engineering-log/openapi.yml`, specifically
`StoneSearchResponse`, as the reference for local mock entries. Keep 30 entries in the local dataset and expose contract-shaped pages through
the data source, with a default size of 12 and a maximum of 24. No network requests or mock HTTP server are needed.
Use the contract enum values for stone types, sizes and adoption statuses.
Store the supplied placeholder under the UI public directory.

## Presentation

Build a static header and a responsive catalog grid with CSS. Render the current page of local
entries. Reserve desktop side space for future filters and chat; reclaim that
space on small screens. Use the provided image as the visual reference.
Clamp biographies to two lines. Keep excluded controls out of the UI.

## Verification

Run lint, Vitest and production build after each implementation task. Verify
catalog content and missing-photo fallback with component tests when rendering
is implemented. Check representative desktop, tablet and mobile widths visually
in the final verification task.

## Component Refactoring

Extract Header, Content, Catalog and StoneCard into src/components. Catalog
accepts stone entries through props; Content obtains them from the data source. Content
composes the catalog and the reserved side areas. Keep existing CSS classes.

Add Footer with current-year copyright. Move API types into a dedicated module
and provide mock entries through a local catalog data-source function used by
Content. Use explicit stone-type and size labels in StoneCard.

Move each component into its named directory and update relative imports.
Group Header, Footer and Content under components/Common. Keep App, its CSS
and its existing tests together in src/App. No barrel files are needed.

Accepted decisions: [ADR-0005](../../docs/adr/0005-ui-catalog-structure.md).

## Pagination

Content owns page/size state. The mock data source slices entries and returns
StonesSearchResponse metadata. Catalog consumes the response and delegates
controls to Common/Pagination/Pagination.tsx. Use existing React state and CSS.
Verify page boundaries, complete traversal and size reset through interaction tests.

Keep four grid columns at widths of 960 pixels and above; reduce the reserved
side areas on narrower desktop to preserve card readability. Keep existing
tablet/mobile breakpoints.

Extract existing enum unions into named type exports in src/enums. Use type-only
imports in DTOs and explicit presentation mappings; keep runtime values unchanged.

## Feature Architecture Refactoring

Implement ADR-0006 with synchronous mock API delegation through api/stonesApi.
Move pagination state to useCatalog and render CatalogPage inside PageLayout.
Split CSS by existing selector ownership while preserving breakpoint order and
values. Move contract DTOs separately, fixtures under mocks/data and the paging
adapter under mocks/api. Preserve existing interaction tests and startup.

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

Use CSS zoom on the catalog grid for 70% layout-aware scaling. Update local
UI/mock defaults to 8; retain existing backend contract defaults and maximum.
Verify all three size options and responsive rendering.

Remove compact grid width/zoom rules to restore original card dimensions.
Preserve the eight-card default and existing size choices.
