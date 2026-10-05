# Tasks

- [x] T0005-001: Create 30 contract-compatible local mock stone entries and make
  the supplied placeholder available in the UI public directory. Verify dataset
  count, identifiers and contract enum values; run frontend checks.
- [x] T0005-002: Implement the static English header and responsive catalog from
  the visual reference, including required card fields, two-line biographies,
  missing-photo fallback and reserved future feature areas. Add meaningful
  component verification and run frontend checks.
- [x] T0005-003: Visually verify desktop, tablet and mobile layouts, resolve
  layout defects and record results against acceptance.md. Run frontend checks.

Execute one task at a time. Do not create commits unless explicitly requested.

T0005-001 verification: 30 unique entries checked against YAML enum values;
frontend lint, existing Vitest test (1/1) and production build passed.

T0005-002 verification: static header and all 30 cards implemented; lint,
4/4 Vitest tests and production build passed.

T0005-003 verification: Chrome screenshots inspected at 1440, 768, 390 and
320 pixels. Runtime checks confirmed 30 cards, no horizontal page overflow and
two-line biography bounds at every width. Removed body minimum width to fix
320-pixel scrollbar overflow. Final lint, 4/4 tests and build passed.
