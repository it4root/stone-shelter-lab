# Feature 0010: Acceptance Criteria

Acceptance criteria are defined only here. Automated verification passed for
the implemented routing changes. Real browser checks remain pending as recorded
below; documentation preparation is not runtime verification.

| ID | Given / When | Expected result | Verification |
| --- | --- | --- | --- |
| AC-0010-001 | Each canonical URL is opened directly | `/stone-shelter/catalog` renders the catalog, `/stone-shelter/stones/1` renders stone 1, and `/stone-shelter/add-stone` renders creation, with shared Header/Footer | Application tests and browser direct-entry checks |
| AC-0010-002 | Root, application root, legacy creation/detail paths or recognized trailing-slash variants are opened | The specified canonical URL is displayed; redirect uses history replacement, preserves query/fragment and does not create a Back loop | Navigation tests and browser history check |
| AC-0010-003 | Card photos, Add stone, Back to catalog, View stone or either the top-left header image or Stone Shelter text are activated | Every link has a canonical href and opens the intended page or exact stone; the header contains only the shared brand link, with no menu or former menu entries | Link and application interaction tests |
| AC-0010-004 | Normal internal navigation followed by browser Back/Forward | URL and rendered page agree without document reload; creation-page revisits start a fresh form | Application history tests and browser check |
| AC-0010-005 | A link is activated by keyboard, modified click, new-tab action, or an external/download link is used | Internal links are keyboard-accessible; native browser behavior remains available where appropriate | Interaction tests and real keyboard/new-tab checks |
| AC-0010-006 | Catalog choices and scroll are set before visiting details or creation and returning | Filters, sorting, page, size, sidebar state and catalog scroll remain; details begin at the top; direct entry uses existing defaults | Session regression tests and browser scroll check |
| AC-0010-007 | An unknown page, malformed detail identifier or missing stone is requested | Unknown pages show Page not found; detail failures show Stone not found; both offer canonical Back to catalog and never substitute a different stone | Route/error-state tests |
| AC-0010-008 | Creation, gallery and adoption flows are exercised through canonical routes | Existing flows and catalog refresh work with their documented mock lifecycle; no role restrictions, authentication, new backend calls or persistent browser storage are introduced | Existing integration regressions and scope review |
| AC-0010-009 | A canonical page is refreshed on the local Vite server | Its entry document and assets load and the correct page renders; README describes canonical URLs and production SPA fallback requirements | Local server requests, browser refresh and documentation review |
| AC-0010-010 | Completed implementation is verified on Node 24.21.0 / npm 11.19.0 | Frontend lint, tests limited to changed routing/link behavior and production build pass; routing definitions are shared rather than duplicated, App remains composition-only, package versions are unchanged, and the local UI server remains running with its URL reported | Commands and source review |

## Evidence Policy

Record actual automated and browser results separately. DOM tests and HTTP 200
responses do not establish real browser refresh, scroll or keyboard behavior.
Leave unavailable checks pending and identify the limitation without weakening
the criteria. Use existing Vitest/Testing Library facilities and reset runtime
mock state between tests.

The user explicitly limited test execution on 2026-10-08. Run the affected
navigation/creation application tests, the changed header-link assertion and
detail back-link checks; do not run unrelated backend, mock-boundary, validation,
form, gallery or adoption suites. Keep this verification limitation visible.

## Header Revision Evidence — 2026-10-09

AC-0010-003: automated checks confirm the header contains only the shared
`Stone Shelter` anchor and no menu. Clicking its SVG image or heading returns
from details to the canonical catalog. AC-0010-004: the same interaction check
confirms history navigation and no duplicate entry on a same-page click.
AC-0010-005: the existing native-link guard regression passed; the brand uses a
real anchor with visible keyboard focus. Real browser keyboard checks remain
pending. AC-0010-010: four selected checks passed (26 unrelated cases skipped),
lint and production build passed on the pinned runtime, and the reused Vite
server at `http://127.0.0.1:5175/stone-shelter/catalog` returned the entry HTML.
No real browser rendering check was performed for this revision.

## Verification Evidence — 2026-10-08

On Node 24.21.0 / npm 11.19.0, 31 selected tests across five affected files
passed. The initial run selected those 31 tests and excluded 23 unrelated cases
in the same files; it found one creation-confirmation focus failure. The code
now moves focus during the layout effect before paint, retaining the original
focus assertion. Only the eight affected creation/navigation cases were rerun;
all eight passed. The other 23 selected checks had already passed. No full
frontend or backend test suite was run, as explicitly requested by the user.

Both `npm run lint` and `npm run build` passed after the focus fix.
`git diff --check` passed. No dependencies, lockfile, backend, API contracts,
database changes, commits or pushes were introduced.

| Criteria | Actual evidence | Status |
| --- | --- | --- |
| AC-0010-001 | Direct canonical detail and creation rendering, catalog recovery and shared layout passed in application tests | Automated passed; browser direct entry pending |
| AC-0010-002 | Six root/legacy/trailing-slash cases preserve search, fragment, history state and history length | Automated passed; real browser history pending |
| AC-0010-003 | Card/creation/success/back href assertions and header catalog navigation/history passed; remaining header entries are static | Passed automated and source review |
| AC-0010-004 | Back/Forward, gallery reset, fresh creation revisits and late creation isolation passed without replacing the runtime data source | Automated passed; real browser history pending |
| AC-0010-005 | Real anchors remain; Ctrl/Meta/Shift/Alt/middle-click, target, download and external guards passed | Automated passed; real keyboard/new-tab interaction pending |
| AC-0010-006 | Filters/date drafts, sort, page, size, sidebar and captured scroll restoration passed; direct-entry defaults and detail top scrolling passed | Automated passed; actual browser scroll pending |
| AC-0010-007 | Unknown page recovery/focus and missing/malformed/zero/unsafe detail identifiers passed | Passed automated |
| AC-0010-008 | Photo-free creation/readback, catalog refresh, created-stone adoption and existing-stone reservation across navigation passed; gallery reset passed | Passed affected integration checks and scope review; unrelated suites intentionally excluded |
| AC-0010-009 | Three canonical pages and the legacy creation path returned 200 HTML; changed route/creation modules returned JavaScript and placeholder returned PNG; README updated | Server/documentation passed; real browser refresh pending |
| AC-0010-010 | Pinned runtime, selected tests, lint, build, shared routes, unchanged package versions and running server verified | Passed with the authorized limited test scope |

The existing local Vite server remains running at
`http://127.0.0.1:5174/stone-shelter/catalog`. Local HTTP checks required sandbox
network escalation and succeeded. These responses prove entry/asset availability,
not browser rendering or refresh behavior.

Browser verification is unavailable: the computer-use inventory reported no
apps/browsers, and attempts to open both `iab` and `chrome` returned
`Browser is not available`. T0010-003 remains partially verified. No physical
refresh, keyboard/new-tab, Back/Forward or scroll pass is claimed.
