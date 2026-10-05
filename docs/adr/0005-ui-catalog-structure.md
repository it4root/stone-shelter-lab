# ADR 0005: Mock-driven catalog UI and component organization

Date: 2026-10-05

Status: Accepted by the user during feature 0005 and its subsequent refactoring.

## Context

[Feature 0005](../../specs/0005-ui-mock-to-code/spec.md) implements an initial
responsive stone catalog from a desktop image. The user requested local mock
startup, a limited catalog scope, separate components and consistent directory
naming. The UI must follow the backend contract without requiring a running
backend or adding speculative features.

## Decision

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

## Consequences

The catalog starts independently of backend infrastructure. The data-source
boundary separates mock fixtures from rendering, while API types and explicit
labels remain reusable. Generated-contract changes must be reflected in local
UI types and fixtures; this iteration does not automate type generation.

The component directory structure makes responsibilities explicit and keeps
shared page elements together. Static navigation and reserved side areas provide
only the agreed layout; future interactive features require their own specs.
The supplied placeholder is a known exception to English text within images.

## Alternatives considered

- Connect to a live backend immediately: excluded by the local mock scope.
- Add an HTTP mocking framework: unnecessary for a local data-source boundary.
- Put types and mock data directly in App or reusable components: rejected in
  favor of composition and separation at the data-source boundary.
- Keep all components in App or a flat component directory: replaced by named
  directories and the Common group at the user's request.
- Implement controls visible in the reference image: excluded by agreed scope.
- Translate or replace the selected placeholder bitmap: not requested.

## Amendment: Catalog Pagination

On 2026-10-05 the user included pagination in scope: 12 cards by default and
a maximum of 24 per page. This supersedes the original collection-only decision
and pagination exclusion. The mock data source now returns the generated
StonesSearchResponse structure, and the UI uses its totalElements, page and size
metadata. Offer sizes 12 and 24, reset to the first page on size change and keep
the existing backend page-size constraints. No new dependency or live API call.

## Amendment: Desktop Column Count

The user requested four cards per row. Desktop now retains four columns at
960 pixels and above, superseding the three-column narrower-desktop decision.
Tablet and mobile keep two and one columns respectively.
