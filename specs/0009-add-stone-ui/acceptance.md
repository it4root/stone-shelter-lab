# Add Stone UI — Acceptance Criteria

Criteria are defined only in this file. IDs are stable. Full page acceptance
is partially verified; automated and unavailable browser checks are recorded below.

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| AC-0009-001 | The mock catalog is open | The visitor selects Add stone | /stones/new shows the named creation page, form, shared Header/Footer and Back to catalog link | Application navigation test |
| AC-0009-002 | Direct /stones/new navigation, including trailing slash | The page loads, refreshes or is reached with browser history | The creation page is recognized before detail IDs; existing numeric and unknown detail routes keep their behavior | Routing tests and browser check |
| AC-0009-003 | Catalog filters, sort, page and size are selected | The visitor enters and leaves creation | The existing catalog session choices remain; modified link clicks retain native browser behavior | Navigation regression tests |
| AC-0009-004 | A fresh creation form | The controls are inspected | Name, type, size, optional biography and optional photos have accessible English labels; type/size are unselected; no admission-date input exists | Component test |
| AC-0009-005 | Missing/blank name or choices, name over 120 or biography over 2048 characters | Submission is attempted | Field-associated errors are exposed, first invalid control is focused and no creation call occurs | Validation and interaction tests |
| AC-0009-006 | Valid details, including Unicode text and an existing stone name | Submission is accepted | Name/biography are preserved, AVAILABLE is sent explicitly, admissionDate is absent from the request and the mock returns its current UTC creation instant | Boundary payload and controlled-clock tests |
| AC-0009-007 | No photos were selected | The visitor submits valid details | Creation succeeds with an empty photoUploadIds array, empty returned photos and no uploaded placeholder or fabricated photo reference | Mock and page integration |
| AC-0009-008 | Zero selected photos or a created stone with no photos | Preview, success, catalog and details are displayed | The creation grid shows 16 empty slots; success, catalog and details use the existing /placeholder-rock.png asset; no missing-image display is shown | Component/integration and browser checks |
| AC-0009-009 | Valid JPEG/PNG/WebP files, including a file at exactly 10 MiB | Up to 16 are selected across batches | Draft mock uploads provide usable previews with UUIDs and the response time fields; selection order and count are retained | Mock upload and selection tests |
| AC-0009-010 | Previously accepted photos and a batch exceeding 16 total, containing an empty/unsupported file or a file over 10 MiB | The new batch is selected | The entire invalid batch is rejected before uploads; an accessible error appears and previous photos/details remain intact | Selection tests |
| AC-0009-011 | Accepted photos | One or all photos are removed, or the file picker is cancelled | Remaining order and cover update; details remain; removal/cancellation does not create a stone; an empty gallery restores the 16 empty slots and remains submittable | Interaction tests |
| AC-0009-012 | Draft mock uploads are pending | Details are edited and submission/selection/removal are attempted | Details stay editable; busy state is announced; creation and photo mutation are disabled until uploads finish | Deferred-promise interaction test |
| AC-0009-013 | Successful draft uploads and valid details | Add stone is selected | Exactly the current ordered draft UUIDs are submitted with details; no file bytes or placeholder URL appear in the creation request and files are not uploaded again | API-boundary integration test |
| AC-0009-014 | Creation is pending | The button or Enter is used repeatedly | One creation call occurs; inputs are locked and Adding stone… is exposed until completion | Deferred-promise interaction test |
| AC-0009-015 | An accepted mock creation request with zero, one or 16 photos | The promise completes | A contract-shaped successful response has a unique numeric stone ID, submitted details and complete ordered photo entries; mock failure modes are not introduced | Mock operation tests |
| AC-0009-016 | Successful creation | The result is displayed | The same route shows Stone added successfully., created name/ID, returned cover or placeholder, and View stone/Back to catalog links; the old submit form is gone | Success interaction test |
| AC-0009-017 | The success state | Add another stone is selected | A fresh form has empty name/biography, unselected type/size and no photos/date input; previous success and draft references are absent | Interaction test |
| AC-0009-018 | One or more mock-created stones | Catalog/detail reads are made in the current runtime | Added stones have matching fields, cover and photo positions; search filtering/sorting/pagination/totals include them correctly; the original fixture objects remain unchanged | Mock readback and catalog integration tests |
| AC-0009-019 | Existing catalog session settings | The visitor returns after successful creation | Visible results/totals refresh without automatically resetting session choices or forcing a nonmatching stone into the page | Application integration test |
| AC-0009-020 | A newly created AVAILABLE mock stone | The existing adoption operation succeeds | Details/catalog reflect RESERVED using the existing reservation overlay; existing fixture reservation behavior still passes | Mock reservation regression test |
| AC-0009-021 | An unsaved form or runtime additions | The creation route is revisited or the app is fully reloaded | Revisiting starts a fresh form; a full reload loses runtime additions; no browser persistent storage or real backend writes occur | Lifecycle and architecture review |
| AC-0009-022 | Keyboard and screen-reader interaction | Fields, validation, photo removal, progress and success are used | Controls have accessible names/help/errors, focus is visible and managed on navigation/validation, and progress/success are announced | Accessibility interaction tests and browser check |
| AC-0009-023 | Desktop/tablet/mobile widths 1440/1024/768/390/320 | Creation, populated gallery, validation and success are displayed | Form/gallery adapt without horizontal overflow; controls remain usable and the existing visual style/placeholder are preserved | Browser layout checks |
| AC-0009-024 | A failed preview image or reduced-motion preference | The page renders and is used | Broken images use the existing placeholder; motion is reduced without blocking interactions | Component test and browser check |
| AC-0009-025 | The API runs independently of the UI | Generated JSON/YAML and frontend DTOs are compared | Creation/gallery and draft upload fields, enums and limits agree; dedicated frontend DTOs are outside mocks; no handwritten HTTP contract is introduced | Generated-contract review |
| AC-0009-026 | The completed frontend feature | Lint, all frontend tests and production build run on pinned Node/npm | All checks pass with existing catalog, details/gallery and adoption tests; code follows frontend boundaries with no new dependency; backend changes are limited to the authorized T0008-009 server-date dependency | Commands and source review |
| AC-0009-027 | The creation form with zero, some or 16 uploaded photos | The preliminary gallery is displayed or photos are removed | One fixed 4 × 4 grid with 16 square slots occupies the former large-image area above the chooser; uploaded photos fill slots in order with cover/removal controls, unused slots have no visible numbers, retain accessible names and no duplicate large preview or lower gallery appears | Existing interaction tests and browser layout checks |
| AC-0009-028 | The creation form | Details and photo help are displayed | The visible Stone details heading, introductory paragraph, static Name/type/size/Biography hints and additional-selection sentence are absent; labels, required markers, photo format/limit help and associated validation errors remain | Source review and existing form/photo interaction tests |
| AC-0009-029 | Valid details with zero or uploaded photos | Creation is submitted and the result read back | No admissionDate is held in form state or sent; creation/detail/search retain the server-owned response timestamp, and frontend DTOs agree with the revised generated backend contract | API-boundary, mock clock, application and generated-contract checks |

## Verification Rules

Use the existing Vitest/Testing Library setup. Isolate and reset runtime mock
state per test, including additions, drafts, generated IDs and reservations.
Use controlled pending promises instead of timing-dependent sleeps. Assert
boundary calls and observable behavior, not copies of the implementation.

Perform real browser layout/history/keyboard checks at the listed widths. Record
actual commands, results and any unavailable browser checks here or in task
completion evidence. Keep criteria pending until their checks run; do not claim
visual passes from DOM tests alone. Leave the local UI server running after
frontend verification and report its URL.

## Partial Verification — T0009-001

On 2026-10-07, the API/mock portions of AC-0009-006, AC-0009-007,
AC-0009-009, AC-0009-015, AC-0009-018, AC-0009-020, AC-0009-021 and
AC-0009-025 were checked through 14 new mock-boundary tests and generated
contract review. Creation/detail/catalog responses, raw local upload bytes,
reference ordering, unique IDs, search totals, fixture immutability, reservation
readback and runtime reset passed. The current generated JSON/YAML were read
from isolated backend test infrastructure; its seven contract tests passed.

Frontend lint, all 82 tests and production build passed on the pinned Node/npm.
This evidence does not complete page, browser, client-validation, UTC conversion
or form-lifecycle criteria: those belong to subsequent tasks. At this checkpoint,
no visual checks or completed creation page were claimed. Subsequent delivery
verification is recorded below.

## Delivery Verification — T0009-002 through T0009-005

On 2026-10-07, T0009-002, T0009-003 and T0009-004 were implemented after the user
authorized continuous execution. Final verification used Node 24.21.0 and
npm 11.19.0 with unchanged package.json/package-lock.json. All commands passed:

- `npm run lint` — no errors or warnings.
- `npm run test -- --run` — 119 tests in 15 files passed, including 51 new
  creation-boundary, form/date, photo-selection and application cases.
- `npm run build` — TypeScript and Vite production build passed.
- `git diff --check` — passed.

The existing Vite server remains running at http://127.0.0.1:5174/.
HTTP checks returned 200 for `/stones/new`, `/stones/new/`, the compiled
AddStonePage module and `/placeholder-rock.png`. HTTP responses confirm server
availability and client-route fallback; they do not prove browser rendering.

| Acceptance ID | Evidence | Result |
| --- | --- | --- |
| AC-0009-001 | Application entry test, named main, shared Header/Footer and back link | Passed automated check |
| AC-0009-002 | Direct/trailing-slash routing, fresh remount, history tests and HTTP fallback | Automated checks passed; real browser refresh/history pending |
| AC-0009-003 | Page/size/sort/filter/scroll retention and native modified link test | Passed automated check |
| AC-0009-004 | Form defaults, English labels, required controls and UTC today tests | Passed automated check |
| AC-0009-005 | Missing/blank/overlength/future/date validation, associated alerts, focus and boundary guards | Passed automated check |
| AC-0009-006 | Exact Unicode/whitespace payload, duplicate fixture name, leap day and UTC-midnight checks | Passed automated check |
| AC-0009-007 | Zero-photo request/response and no-upload application test | Passed automated check |
| AC-0009-008 | Placeholder preview, confirmation, catalog/detail checks and asset HTTP 200 | Automated checks passed; visual check pending |
| AC-0009-009 | Real mock file bytes/UUID/lifetime tests plus ordered batches, repeated files, 16 references and exact 10 MiB | Passed automated check |
| AC-0009-010 | Atomic invalid batches: unsupported/empty MIME, empty bytes, oversize and cumulative count | Passed automated check |
| AC-0009-011 | Cover/order removal, cancellation, remove-all and empty-reference submission | Passed automated check |
| AC-0009-012 | Deferred uploads: editable details, disabled mutation/submission and announced progress | Passed automated check |
| AC-0009-013 | Exact remaining ordered references, no legacy cover/file payload and no second upload | Passed automated check |
| AC-0009-014 | Deferred creation, repeated form submission/clicks, disabled inputs and one API call | Passed automated check |
| AC-0009-015 | Zero/one/16 mock creations and application readback, distinct numeric IDs | Passed automated check |
| AC-0009-016 | Same-route identity/status/focus/preview/links and removed old form | Passed automated check |
| AC-0009-017 | Add another stone resets every detail, UTC date and photo reference | Passed automated check |
| AC-0009-018 | Mock search/order/totals/paging/immutability and all created-stone views | Passed automated check |
| AC-0009-019 | Matching/nonmatching additions refresh catalog with unchanged session settings | Passed automated check |
| AC-0009-020 | New-stone adoption integration and existing reservation regressions | Passed automated check |
| AC-0009-021 | Route revisit, late upload/creation isolation, runtime reset and source review of in-memory maps | Passed automated/source checks; physical browser reload pending |
| AC-0009-022 | Label/help/error associations, navigation/error/success focus, busy/status and removal names | Automated checks passed; real keyboard/browser accessibility check pending |
| AC-0009-023 | Responsive CSS uses bounded widths, minmax columns and narrow-screen stacking | Source review only; all five browser viewport checks pending |
| AC-0009-024 | Broken cover/thumbnail fallback tests and reduced-motion CSS | Automated/source checks passed; browser reduced-motion check pending |
| AC-0009-025 | T0009-001 current generated OpenAPI JSON/YAML review and dedicated DTOs | Passed contract/source check |
| AC-0009-026 | Final pinned-runtime commands, existing regressions and boundary/source review | Passed automated/source checks |

The browser automation inventory returned no apps or browsers. Attempts to open
the local page with both `iab` and `chrome` returned `Browser is not available`.
Consequently, no real browser screenshots, keyboard traversal or layout checks
at 1440/1024/768/390/320 were performed. T0009-005 remains partially complete
until those checks can run; full visual acceptance is not claimed. Criteria are
unchanged.

Source review confirms that production components use feature hooks and API
boundaries, with mock imports confined to the API adapter and tests. No fetch,
persistent browser storage, dependencies, backend changes, new image assets,
commits or pushes were introduced. Existing user edits in engineering-log/notes.txt
and the already staged feature-0008 retrospective were preserved.

## Grid Revision Verification — T0009-006

On 2026-10-07, the user requested replacement of the large creation preview and
lower gallery with a fixed grid in the upper photo area. AC-0009-008 and
AC-0009-011 were updated for the empty-grid state, and AC-0009-027 was added
before code changes. Previous delivery evidence describes the earlier layout.

Existing interaction tests passed for 16 empty slots, partial batches filling
slots in order, 16 occupied slots, cover reassignment, remove-all, broken-image
fallback and Add another stone reset. They also verify one gallery preceding
the chooser and no duplicate large preview. Upload pending controls, reference
payloads, invalid batches and zero/one/16-photo creation regressions still pass.
Thus the automated portions of AC-0009-008, AC-0009-009, AC-0009-011,
AC-0009-012, AC-0009-017, AC-0009-022, AC-0009-024 and AC-0009-027 pass
for the revised grid.

Lint, all 119 tests in 15 files and production build passed on Node 24.21.0 /
npm 11.19.0; git diff --check passed. The updated gallery module returned HTTP
200 from the existing server. Source review confirms four minmax columns at
all widths, square slots and bounded controls, with unchanged API/mock logic.

The browser inventory again returned no apps or browsers. Real rendering at the
five required widths, focus appearance and reduced-motion display are still
unverified; AC-0009-023 and the browser portion of AC-0009-027 remain pending.


## Copy Cleanup Verification — T0009-007

On 2026-10-08, AC-0009-028 passed source review: the requested visible heading,
introduction, field hints and additional-selection sentence are removed. Labels,
required controls, admission-date help and photo format/limit help remain.
aria-describedby references only existing help or active errors. Existing form,
validation, upload and creation regression tests passed (119 tests in 15 files),
as did lint and production build on Node 24.21.0 / npm 11.19.0.

The existing server returned HTTP 200 at http://127.0.0.1:5174/stones/new.
This copy-only task adds no browser layout evidence; the previously pending
browser checks remain pending under T0009-005.


## Server-Owned Admission Date Verification — T0009-008 (date portion)

On 2026-10-08, AC-0009-004, AC-0009-005, AC-0009-006, AC-0009-017 and
AC-0009-029 passed the revised automated checks: the form/state/request omit
admissionDate, mock creation assigns the current UTC timestamp, an obsolete
caller cannot override it and detail/search preserve it. All 114 frontend tests
in 15 files, lint and production build passed on Node 24.21.0 / npm 11.19.0.
The lower test count reflects removal of obsolete form-date validation cases.

AC-0009-025 passed review of newly generated JSON/YAML from the isolated
OpenApiDocumentationTest run (seven tests passed on JDK 23.0.2): creation request
properties match the revised frontend DTO and exclude admissionDate; creation
response retains admissionDate as date-time. Four selected backend HTTP tests
passed for no client date and ignored past/future/malformed legacy values,
including database/detail/search timestamp agreement. Full backend regression
verification remains with T0008-009.

The running UI server returned HTTP 200 at http://127.0.0.1:5174/stones/new.
No additional real-browser layout or keyboard checks were performed; previously
pending browser criteria remain pending under T0009-005.

## Final Slot and Server-Date Verification — T0009-008

The delayed changes began after the requested 25-minute interval. All 16 empty
slots now have no visible content and retain accessible names. The form has no
date input/state/client date validation, and creation sends no admissionDate.
Previously recorded calendar/numbered-slot evidence describes the former
behavior. AC-0009-027's automated checks pass for the revised empty grid;
AC-0009-028's requested copy remains absent with labels and errors preserved.

Final lint, all 114 tests in 15 files and production build passed on Node
24.21.0 / npm 11.19.0. Zero/one/16-photo creation, remaining validation,
progress, gallery, catalog/detail and adoption regressions pass. Revised
AC-0009-004–AC-0009-006, AC-0009-017 and AC-0009-029 have passing automated
evidence. Creation/draft DTO fields, enum values, time/UUID formats and the
16-reference limit agree with current generated OpenAPI JSON/YAML; thus
AC-0009-025 and AC-0009-026 pass their automated/source checks. T0008-009 full
backend verification passed with 205 tests and four Python loader tests.

The running page at http://127.0.0.1:5174/stones/new returned HTTP 200.
git diff --check passed. No dependency, migration, real-data population, commit
or push was introduced. Browser inventory contains no apps or browsers;
T0009-005 and real viewport/keyboard checks remain partial, and full visual
acceptance is not claimed.
