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
- Reserve layout space for future filters and a chatbot without implementing
  their controls or functionality.
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

This feature does not change backend HTTP endpoints or require live API calls.

## Out of Scope

- Filter controls and filtering behavior.
- Chatbot controls, messaging and chatbot integration.
- Favorites, heart controls and favorite persistence.
- Adoption controls and adoption flows.
- Working header navigation and destination pages.
- Stone detail pages and detail actions.
- Sorting remains out of scope.

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
