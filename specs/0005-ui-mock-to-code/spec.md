# Feature 0005: Responsive Stone Catalog from a UI Mockup

## Goal

Build an English-language, responsive React stone catalog using `catalog.png`
as the visual reference. The UI must run with local mock data without requiring
a running backend.

## Scope

- Implement the page layout, header and stone catalog in the existing React UI.
- Create mock data for exactly 30 stones using the backend's generated OpenAPI
  YAML contract as the reference for field names, types, enums and response shape.
- Keep header navigation labels visible as static text that does not navigate.
- Implement the filter panel described below. Reserve layout space for a future
  chatbot without implementing its controls or functionality.
- Adapt the desktop reference for tablet and mobile screens independently;
  a separate mobile mockup is not required.
- Use English for all visible interface text and mock stone content.

## Catalog Cards

Each card must display:

- A stone photo, or `placeholder-rock.png` when no photo is provided.
- The stone's name.
- The stone's size.
- The stone's type (the backend field representing the requested breed).
- The stone's biography, visually limited to two lines with overflow truncated.

Use contract-supported values for size and type rather than inventing additional
API fields to reproduce decorative content from the reference image.
The placeholder asset must be named `placeholder-rock.png`, without a leading
space, and be available to the implemented UI.

## Visual and Responsive Requirements

Follow the reference's overall visual direction, including its light background,
green accents, header, image-led cards, spacing and rounded borders. The agreed
scope and card content take precedence over extra controls shown in the image.

The catalog grid must adapt to available width and remain readable on desktop,
tablet and mobile without horizontal page scrolling. Mobile layout decisions,
including placement of static header labels and reserved future areas, are part
of implementation; unused side areas must not crowd the mobile catalog.

## Data and HTTP Contract Requirements

The generated backend `/v3/api-docs` and `/v3/api-docs.yaml` remain the HTTP
contract source of truth. Use the generated YAML to prepare the mock dataset;
do not introduce or maintain a separate handwritten OpenAPI contract.

Mock catalog entries must follow the existing stone search response schema.
If represented as paginated responses, retain the contract's `content`, `page`,
`size` and `totalElements` shape and its documented pagination constraints.
The local dataset contains 30 stones in total; this does not require returning
all 30 in a single API-shaped page.

The initial catalog uses local mocks. The sorting extension below updates the
existing backend search contract; live UI API calls remain out of scope.

## Out of Scope

- Chatbot controls, messaging and chatbot integration.
- Favorites, heart controls and favorite persistence.
- Adoption controls and adoption flows.
- Working header navigation and destination pages.
- Stone detail pages and detail actions.
- Live backend integration for the UI remains out of scope.

## Acceptance

Acceptance criteria are maintained in [acceptance.md](acceptance.md).

## Component Structure

Keep the header, page content layout, catalog and stone card in separate React
component files. App composes the page components. This refactoring preserves
existing catalog behavior and styling. Add a separate semantic footer displaying ©, the current year and Stone Shelter.
It has no links or additional functionality. Keep App limited to page composition.
API types live outside mock data; mock data is supplied at a data-source boundary.
Use explicit English presentation mappings for API enum values.

Each React component lives in a directory named after that component. Shared
page components Header, Footer and Content live under `src/components/Common`.
Catalog and StoneCard live under `src/components`; App lives under `src/App`.

## Catalog Pagination

Show 12 cards per page by default. Offer page sizes 12 and 24; never show more
than 24 cards per page. Provide numbered pages and Previous/Next controls with
boundary buttons disabled. Changing page size resets the page to the first page.
Use zero-based page indices internally and one-based labels in the UI. Display
the total stone count from response metadata, not the current page length.
The mock data source returns the existing StonesSearchResponse shape: content,
page, size and totalElements. No backend endpoint changes or live calls.

## Catalog Column Count

Desktop uses four cards per row, including narrower desktop widths. Tablet
retains two columns and mobile one column. With the default page size, desktop
shows three rows of four cards.

## Frontend Enum Types

Define StoneType, StoneSize and AdoptionStatus separately in src/enums, each
in its own PascalCase-named file. DTOs and presentation mappings import these
types rather than declaring inline unions. Preserve backend contract values.

## Feature-Oriented Architecture

Follow [ADR-0006](../../docs/adr/0006-ui-feature-architecture.md), which supersedes
the earlier component locations. Keep reusable layout in Common/PageLayout,
catalog components and useCatalog under features/catalog, StoneCard and labels
under domain/stone, DTOs under api/dto, and fixtures/adapters under mocks.
Colocate component CSS and keep shared styles/tokens under styles. Preserve
existing behavior and introduce no live HTTP calls or new dependencies.

## Catalog Sorting: UI and Backend Extension

Place an accessible sorting dropdown on the right of the catalog heading, as
shown in catalog.png. On narrow screens it may wrap without horizontal overflow.
Use these English options and exact API mappings:

| Label | sort.field | sort.direction |
| --- | --- | --- |
| Newest first | admissionDate | desc |
| Oldest first | admissionDate | asc |
| Name: A–Z | name | asc |
| Name: Z–A | name | desc |
| Size: small to large | stoneSize | asc |
| Size: large to small | stoneSize | desc |

Default to Newest first. Changing sort resets to the first page and preserves
the selected page size. Changing page or size preserves the selected sort.
Sort the complete matching dataset before slicing a page; do not sort only the
visible cards. Size order is SMALL, MEDIUM, LARGE ascending and its reverse
descending. Name ordering uses existing backend behavior; no new case or locale
normalization is introduced. For equal sort values always use id ascending,
regardless of the selected direction. Preserve response totals and pagination.

### Meaning of the Date

Use the existing client-supplied admissionDate timestamp. Product terminology
may call it the date added or admission date; both mean admissionDate here.
Do not introduce createdAt, a new database column or a migration. Do not change
how admissionDate is supplied, validated or updated. Newest/oldest refer to
chronological timestamp order, not identifier order or record creation time.

### HTTP Contract Requirements

Extend the existing POST /api/v1/stones/search request sort.field whitelist to
name, stoneSize and admissionDate. Explicit admissionDate accepts asc and desc.
When sort or its field is omitted/null, use admissionDate; its omitted/null
direction defaults to desc. Explicit name and stoneSize default to asc when
direction is omitted/null. Honor any explicit valid direction. Unsupported
fields/directions retain HTTP 400 ProblemDetail behavior. Keep a single sort
criterion and id ASC as the deterministic tie-breaker.

Keep the existing request structure and response shape (content, page, size,
totalElements), statuses and routes. Update shared DTO validation and generated
OpenAPI descriptions so /v3/api-docs and /v3/api-docs.yaml advertise the expanded
whitelist; do not maintain a handwritten contract. Repository ordering remains
in the repository layer. These requirements supersede feature 0003's explicit
name/stoneSize-only whitelist without changing its existing defaults.

### Frontend Implementation Boundaries

Retain the mock API boundary and 30 stones. Pass sort parameters through the
feature hook and API boundary to the mock adapter, which orders before paging.
Keep selectable enum types in separate files and explicit option mappings.
Use the accepted feature architecture and per-component directory convention.
No sorting library, global store or live HTTP integration is required.

## Catalog Filters: UI and Backend Extension

Implement the filter panel in the left-hand area of catalog.png using the
existing feature architecture. The panel contains exactly these UI groups:

- Size: checkbox multiselect for Small, Medium and Large, mapped to existing
  SMALL, MEDIUM and LARGE values.
- Stone type: checkbox multiselect for all ten existing contract StoneType values,
  with explicit English labels.
- Admission date: From and To date inputs filtering existing admissionDate.

### Matching and Pagination

Within a multiselect group combine selected values with OR; combine active groups
with AND. An omitted, null or empty group imposes no restriction. Selections
apply immediately; no Apply button is required. Evaluate filters against the
complete dataset, then sort, then paginate. totalElements counts matching stones.

A valid filter change resets to page 1, preserving the selected sort and page
size. Page, size and sort changes preserve filters. When there are no matches,
show an English empty-state message, keep the panel and Reset filters available,
show totalElements 0 and no numbered pages; Previous/Next are disabled.
Reset filters clears all selected groups, date inputs and date validation errors,
returns to page 1 and preserves sort, page size and panel expansion state.

### Dates and Validation

Dates use YYYY-MM-DD calendar values. Both endpoints are optional: From alone
means on/after that day; To alone means on/before that day. Both boundary days
are included. Compare against admissionDate in UTC: lower bound is From at
00:00:00Z inclusive; upper bound is the start of the day after To exclusive.
Equal endpoints select one complete UTC day. No new future-date restriction is
introduced for search bounds. Do not change admissionDate creation validation.

Reject malformed/nonexistent date values and ranges with From later than To.
Show an accessible English inline validation message associated with the inputs.
Do not apply invalid draft dates: retain the last valid applied date filter and
its results until corrected or reset. Valid size/type changes still apply using
that last valid date range. Invalid date edits alone do not reset the page.
Clearing endpoints to a valid open range applies immediately.

### Expansion, Count and Responsive Behavior

Use the English heading Filters with a nearby toggle button. Clicking that
button expands/collapses the fields; expose aria-expanded and aria-controls.
Collapsing hides only the inputs; applied filters continue affecting results.

When collapsed, display a numeric badge for the number of active applied groups
(0–3), not selected values. Any sizes count as one group, any types as one group,
and either or both valid applied date endpoints as one group. Two sizes plus
three types plus a date range therefore display 3. Invalid draft dates do not
change the applied-group count. Reset filters remains available while collapsed,
including when a hidden invalid draft needs clearing.

Initially expand on desktop (960 pixels and above); initially collapse on tablet
and mobile, where the panel is above the catalog. User toggles persist for the
current mounted page; responsive layout changes must not clear filter values.
No localStorage or navigation persistence is required. Labels, checkboxes, date
inputs and the toggle must be keyboard accessible without horizontal overflow.

### Backend HTTP Contract Requirements

Extend the existing POST /api/v1/stones/search filter object with:

| Field | Type | Meaning |
| --- | --- | --- |
| stoneSizes | array of StoneSize | OR within selected sizes |
| stoneTypes | array of StoneType | OR within selected types |
| admissionDateFrom | ISO calendar date | Inclusive UTC lower day |
| admissionDateTo | ISO calendar date | Inclusive UTC upper day |

All new fields are optional and nullable. Empty arrays impose no restriction;
duplicate values do not affect results. Unknown enum values, null array elements,
malformed dates and reversed ranges return HTTP 400 RFC 9457 ProblemDetail.

Preserve the existing optional singular stoneSize, stoneType and adoptionStatus
filters for compatibility. Each supplied singular constraint is combined with
new groups using AND; inconsistent singular/plural selections yield no matches,
not an error. UI sends only plural size/type fields and date bounds. Adoption
status controls remain outside the UI scope.

Preserve request pagination/sort, success status 200, routes, response shape
(content, page, size, totalElements), empty-page behavior and deterministic sort
ties. Update shared DTOs and generated OpenAPI JSON/YAML to describe the arrays,
optional bounds, semantics and validation. The generated document remains the
only HTTP contract; no handwritten OpenAPI document is maintained.

StoneSearchFilter will have more than four fields and must become a class with
private fields, a no-argument constructor and getters/setters. Controllers retain
binding and @Valid; services own cross-field range validation and criteria
preparation, without duplicating Bean Validation constraints. Repositories own
size/type predicates, date comparisons, ordering and Pageable pagination. No
schema change, new timestamp field or Liquibase migration is required.

### Frontend Scope

UI continues using 30 local mock stones through the API boundary. Add contract
filter DTOs and pass applied filters through useCatalog and the mock adapter.
Keep draft date validation distinct from applied filters and derive group counts
and total-page counts rather than storing redundant state. Use a feature-owned
filter component with colocated CSS and tests; keep PageLayout independent of
filter logic. No live UI/backend integration, new dependency or global store.
These requirements supersede the original filter-placeholder scope.

## Protocol-Independent Filter Validation

Reversed admission-date ranges raise a custom InvalidAdmissionDateRangeException
in the service. ApiExceptionHandler translates it to HTTP 400 ProblemDetail
with the existing validation detail. Services and custom exceptions remain
independent of HTTP status/error types; enforce the boundary with ArchUnit.

## Compact Cards and Page Size Update

Render the catalog card grid at 70% of its previous visual scale (30% smaller
card width/height), with layout occupying the scaled space rather than reserving
empty unscaled card boxes. Keep desktop/tablet/mobile column counts unchanged.
Set the initial UI page size to 8 and offer exactly 8, 12 and 24. Resetting filters
or changing sort must preserve the selected size. This supersedes earlier
12-card UI defaults; backend omitted-size default remains 12, and explicit size 8
is already supported. UI mock API defaults to 8 and maintains the maximum 24.

## Card Size Restoration

Restore the original full-size cards and grid width, superseding the compact
70% scale requirement. Keep the default UI size 8 and choices 8, 12 and 24.
Responsive column counts and other catalog behavior remain unchanged.
