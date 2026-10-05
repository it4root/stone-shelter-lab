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
