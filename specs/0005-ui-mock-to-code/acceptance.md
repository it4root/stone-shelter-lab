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
