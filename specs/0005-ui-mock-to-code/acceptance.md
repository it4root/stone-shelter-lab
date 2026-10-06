# Acceptance Criteria: Feature 0005

1. The React UI starts and displays the catalog using local mock data without
   a running backend.
2. The mock dataset contains exactly 30 contract-compatible stone entries.
3. Every rendered card shows its name, size, type and biography; biographies
   occupy at most two lines.
4. Cards without photos display the provided `placeholder-rock.png` asset.
5. The header contains English navigation labels that do not navigate.
6. The layout follows `catalog.png` within the agreed scope and adapts to
   desktop, tablet and mobile widths without horizontal page scrolling.
7. Space is provided for future filters and chatbot UI without implementing
   those features or compromising mobile readability.
8. Favorites, adoption and other excluded actions are not implemented.
9. Frontend lint, existing tests and production build pass. Responsive layout
   and biography truncation are checked visually at representative widths.

## Verification Results

Verified on 2026-10-05:

- Criteria 1–4: local React rendering uses 30 mock entries; component tests check
  all names, required metadata, biography content and placeholder images. A
  separate test verifies supplied photo values and broken-image fallback.
- Criterion 5: English navigation labels are static text; tests confirm there
  are no links or action buttons.
- Criteria 6–7: Chrome screenshots inspected at 1440×1000, 768×1024, 390×844
  and 320×800. Desktop reserves side space; tablet and mobile reclaim it.
  Runtime checks confirm no horizontal overflow and two-line biography bounds.
- Criterion 8: excluded controls are absent; no API calls or backend changes.
- Criterion 9: frontend lint, four Vitest tests and production build passed.

The supplied placeholder bitmap contains Russian text. It is retained unchanged
as the explicitly selected asset; application text and mock content are English.

## Component Refactoring Criteria

10. Header, content layout, catalog and stone card have separate component files.
11. App composes page components; the existing four rendering tests continue
    to pass and frontend lint and build succeed.

12. A separate semantic Footer displays ©, the current year and Stone Shelter.
13. App only composes page components; API types are separate from mock data,
    data is supplied through the data-source boundary and enum labels are explicit.

14. Every component lives in its own named directory; Header, Footer and Content
    share the Common parent directory. Existing rendering and checks pass.

## Pagination Criteria

15. Initial render contains 12 cards and reports 30 stones in total.
16. With size 12, pages contain 12, 12 and 6 stones respectively; navigation
    reaches every stone without duplication and disables controls at boundaries.
17. Size 24 produces pages of 24 and 6 cards. Changing size resets to page 1.
18. Totals and page controls use response metadata; no page exceeds 24 cards.
    Header navigation and excluded stone actions remain static/absent.

These criteria supersede earlier verification of all 30 cards on one page.

Pagination verification: six component tests passed, including page traversal
and 12/24 size changes; frontend lint and build passed.

19. Desktop widths of 960 pixels and above show four cards per row. Default
    pages show three rows; tablet/mobile retain two/one columns respectively.

20. StoneType, StoneSize and AdoptionStatus each have a dedicated file under
    src/enums. DTOs and presentation mappings reference those types, with exact
    backend values preserved and existing frontend verification passing.

21. Architecture follows ADR-0006: shared layout has no catalog data/state;
    CatalogPage uses useCatalog; domain card/labels, DTOs and mocks are separate.
22. Component CSS is colocated, shared styles use tokens, and existing pagination,
    responsive layout and image fallbacks retain their behavior. No new dependency
    or speculative HTTP/service/store implementation is introduced.

Architecture verification: existing six tests, lint and build passed. Chrome
checks at 1440, 1024, 768, 390 and 320 pixels confirmed preserved pagination
initial count and responsive columns without overflow; screenshots inspected.

## Sorting Acceptance Criteria

23. An accessible English dropdown beside the catalog heading offers exactly
    the six options specified in spec.md and initially selects Newest first.
24. Each option orders the full mock dataset before pagination; size follows
    SMALL/MEDIUM/LARGE, timestamps sort chronologically, and equal values use
    id ASC. Page traversal preserves the selected order.
25. Changing sort resets to page 1 and preserves size; changing page or size
    preserves sort. Page sizes 12/24 and totalElements remain correct.
26. The backend accepts explicit admissionDate asc/desc, preserves existing
    name/stoneSize behavior, omitted-field/direction defaults and id ASC ties.
    Unsupported fields/directions return HTTP 400 ProblemDetail.
27. Generated OpenAPI documents the expanded whitelist. No new database field,
    migration or altered admissionDate input/update semantics is introduced.
28. Frontend lint, tests and build pass; backend verification passes with
    meaningful ordering/default/invalid-input coverage. Desktop/mobile dropdown
    layout is verified and the local UI is left running.

T0005-013 backend evidence (2026-10-06): full Maven verification passed.
Explicit admissionDate asc/desc, default/null direction, deterministic ties
and pagination were tested; generated OpenAPI field pattern and JSON/YAML
equivalence passed. Sorting UI criteria await T0005-014 and T0005-015.

Sorting completion evidence (2026-10-06):

- Criteria 23–25: 13 frontend tests passed. Tests cover all six option mappings,
  default Newest first, timestamp ordering with offsets, domain size ordering,
  ascending id ties, sorting before pagination, fixture immutability and
  page/size/sort interaction.
- Criteria 26–27: T0005-013 passed all 128 backend tests, including generated
  OpenAPI JSON/YAML equivalence and the expanded validation whitelist.
- Criterion 28: frontend lint/build passed; screenshots and runtime layout
  checks at 1440, 1024, 768, 390 and 320 pixels passed. UI remains running
  at localhost:5174. Live backend integration remains outside this feature.

## Filter Acceptance Criteria

29. Filters provides size and type checkbox multiselects for existing contract
    values and optional From/To admission-date inputs with English labels.
30. Groups use AND and multiselect values use OR. Empty groups do not restrict
    results. Filtering occurs before sorting/paging and totals count matches.
31. From-only, To-only and equal-date ranges work with inclusive UTC days,
    including timezone-offset timestamps and timestamps on day boundaries.
32. Malformed/nonexistent dates and reversed ranges show accessible errors;
    invalid drafts retain the last valid applied date range and page. Correction
    applies immediately; reset clears errors and all filter values.
33. Valid filter changes/reset return to page 1 and preserve sort/size. Page,
    size and sort changes preserve applied filters. Empty results show a message
    and zero total, no numbered pages and disabled Previous/Next.
34. The nearby toggle exposes expanded state, hides/reveals fields and retains
    applied filters. Collapsed badge counts applied groups 0–3; two sizes, three
    types and a date range count as 3. Reset is available while collapsed.
35. Desktop initially expands the side panel; tablet/mobile initially collapse
    it above the catalog. Keyboard interaction and narrow layout are verified.
36. Backend accepts plural size/type arrays and optional date bounds; retains
    singular/adoption-status compatibility with AND semantics. Empty/null groups
    and duplicate values behave as specified. Invalid enums/elements/dates/ranges
    return HTTP 400 ProblemDetail.
37. Generated OpenAPI describes the expanded filter DTO. No schema migration,
    new field on Stone or live UI API integration is introduced.
38. Backend PostgreSQL integration/contract verification and frontend lint,
    meaningful filter tests and build pass. Responsive checks are recorded and
    the local UI remains running after verification.

Filter criteria supersede earlier evidence concerning reserved-only filter space.

Filter completion evidence (2026-10-06):

- Criteria 29–34: frontend interaction/adapter/date validation tests passed.
  Coverage includes OR/AND, group-count badge, inclusive UTC/open dates,
  invalid draft retention, reset while collapsed, empty state and preserved
  sort/size with page resets.
- Criterion 35: Chrome verified fresh initial state at 1440, 1024, 768, 390
  and 320 pixels; Space toggles the focused button. Checkbox interaction and
  expanded narrow layouts checked without horizontal overflow.
- Criteria 36–37: backend PostgreSQL tests and generated JSON/YAML tests passed
  for arrays, date bounds and retained singular/adoption-status compatibility.
  No migration or live UI API integration introduced.
- Criterion 38: 131 backend tests and 19 frontend tests passed, along with lint
  and production build. Local UI remains available at localhost:5174.

39. Invalid date order throws a custom protocol-independent exception;
    ApiExceptionHandler retains HTTP 400 ProblemDetail and the validation detail.
    ArchUnit prevents protocol error dependencies in services/custom exceptions.

Criterion 39 verified: 132 backend tests passed, including reversed date-range
ProblemDetail behavior and service/exception protocol-dependency enforcement.

40. Card grid renders at 70% of the previous scale with unchanged responsive
    column counts, no horizontal overflow and two-line biographies.
41. Initial UI render shows 8 cards; page-size choices are exactly 8, 12 and 24.
    With 30 unfiltered stones, size 8 yields pages of 8, 8, 8 and 6. Existing
    sorting/filtering/reset behavior is preserved; backend defaults stay unchanged.

Criteria 40–41 verified: 20 frontend tests, lint and build passed. Browser
measurements confirmed 70% card width/height at five responsive sizes and
eight initial cards; page-size options and complete traversal verified in tests.

42. Cards use their original unscaled dimensions and full grid width; this
    supersedes criterion 40. Default page size 8 and options 8/12/24 are retained.
