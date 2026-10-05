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
- Sorting and pagination behavior are not agreed requirements for this ticket;
  do not implement them implicitly from the reference image.

## Acceptance

Acceptance criteria are maintained in [acceptance.md](acceptance.md).
