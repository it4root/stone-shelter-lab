# Add Stone UI — Tasks

Requirements: [spec.md](spec.md). Technical decisions: [plan.md](plan.md).
Acceptance criteria live exclusively in [acceptance.md](acceptance.md).

## Execution Boundaries

The user explicitly requested continuous execution of all remaining tasks.
Execute T0009-002 through T0009-005 sequentially without a task-boundary pause.
The subsequent layout request authorizes T0009-006, replacing the large preview
and lower gallery with a fixed 16-slot grid. The copy cleanup request authorizes
T0009-007. The delayed slot/date request authorizes T0009-008 and its backend
dependency T0008-009; the pending browser acceptance task remains separate.
After each requested task, run its checks and report one line with the full ID.
Do not commit or push without explicit authorization. Authorized commit messages
must start with 0009-add-stone-ui: and identify the relevant complete task ID.

## Ordered Checklist

- [x] **T0009-001 — Add contract-compatible creation/draft mock operations.**
  - Compare creation and draft-upload shapes with generated OpenAPI JSON/YAML.
  - Add dedicated API DTOs and asynchronous mock-backed boundary operations.
  - Add isolated runtime draft/stone/gallery state and unique ID allocation;
    extend catalog/detail reads and reservation lookup without mutating fixtures.
  - Test success, ordered references, zero/one/16 photos, immutable responses,
    fixture preservation, search totals and reservation compatibility.
  - Verification: frontend lint, full test run and production build; review DTO
    alignment and confirm no live HTTP or persistent browser storage was added.
  - Acceptance references: AC-0009-006, AC-0009-007, AC-0009-009,
    AC-0009-015, AC-0009-018, AC-0009-020, AC-0009-021, AC-0009-025.
  - Dependencies: none.

- [x] **T0009-002 — Build the creation form and photo-free preview.**
  - Add feature page/components, local form state and field/date validation.
  - Compose labelled detail controls, optional photo area, existing placeholder
    and Add stone action in the established responsive style.
  - Test initial defaults, detail validation, UTC conversion, optional biography,
    nonunique names and the zero-photo request without placeholder uploads.
  - Verification: frontend lint, full test run and production build; inspect
    component ownership and accessible labels/errors/focus behavior.
  - Acceptance references: AC-0009-004–AC-0009-008, AC-0009-022–AC-0009-024.
  - Dependencies: T0009-001.

- [x] **T0009-003 — Connect optional photo selection and preliminary gallery.**
  - Validate batches, bind file selection to the draft mock boundary and retain
    ordered upload results across batches.
  - Add previews, cover/count display, removal, empty fallback and upload busy
    state; keep details editable while uploads complete.
  - Test supported types/size boundaries, invalid-batch preservation, total limit,
    order, removal/cancellation, pending controls and late completion isolation.
  - Verify creation receives references without rereading/uploading file bytes.
  - Verification: frontend lint, full test run and production build.
  - Acceptance references: AC-0009-008–AC-0009-013, AC-0009-021,
    AC-0009-022, AC-0009-024.
  - Dependencies: T0009-002.

- [x] **T0009-004 — Add page navigation, successful submission and mock readback.**
  - Add /stones/new route handling and the catalog entry/back links.
  - Connect creation, pending guards, confirmation, result preview, View stone
    and Add another stone without resubmitting the old form.
  - Refresh the existing catalog session after writes while retaining its choices.
  - Test history/direct routes, native modified clicks, repeated submissions,
    zero-photo success/detail/catalog fallback and independent new forms.
  - Verification: frontend lint, full test run and production build; retain the
    existing catalog/detail/gallery/adoption regression checks.
  - Acceptance references: AC-0009-001–AC-0009-003, AC-0009-007,
    AC-0009-008, AC-0009-013–AC-0009-022.
  - Dependencies: T0009-003.

- [ ] **T0009-005 — Verify acceptance and record actual delivery evidence.**
  - Run final lint, full frontend tests and production build on pinned Node/npm.
  - Check browser layout, navigation, keyboard, errors/progress/success, photo
    removal and zero/16-photo cases at the specified viewport widths.
  - Review every acceptance ID; record real results and remaining unavailable
    checks without changing criteria to match the implementation.
  - Confirm contract/API/mock boundaries, source roots, scope and unchanged
    dependencies and the authorized backend date dependency; keep the local UI
    server running and report its URL.
  - Acceptance references: AC-0009-001–AC-0009-026.
  - Dependencies: T0009-001–T0009-004.

- [x] **T0009-006 — Move preliminary photos into a 16-slot grid.**
  - Replace the large creation preview and lower photo list with one upper grid.
  - Preserve selection order, cover, removal, busy controls and photo-free creation.
  - Update existing interaction checks for empty, partially filled and full slots.
  - Verification: pinned-runtime lint, all frontend tests, build and server check;
    record whether browser layout verification is available.
  - Acceptance references: AC-0009-008, AC-0009-009, AC-0009-011,
    AC-0009-012, AC-0009-017, AC-0009-022–AC-0009-024, AC-0009-027.
  - Dependencies: T0009-003 and T0009-004.

- [x] **T0009-007 — Remove requested form explanatory copy.**
  - Remove the visible details heading/introduction and Name/type/size/Biography
    hints; remove the additional-selection sentence from photo help.
  - Preserve labels, required markers, validation and associations with existing
    help/errors; remove styles used only by the deleted copy.
  - Verification: pinned-runtime lint, full frontend tests, production build,
    source review and local server response.
  - Acceptance references: AC-0009-004, AC-0009-005, AC-0009-022, AC-0009-028.
  - Dependencies: T0009-002 and T0009-003.

- [x] **T0009-008 — Remove visible slot numbers and the creation date input.**
  - Keep empty slots visually blank while preserving accessible names.
  - [x] Remove admission-date input/state/validation and request field; mirror the
    backend timestamp in the mock response and preserve date readback.
  - Verify revised request/response DTOs against generated OpenAPI; update
    existing form, mock and application tests for the authorized behavior.
  - Verification: pinned-runtime lint, full frontend tests, production build
    and local server check; record browser availability.
  - Acceptance references: AC-0009-004–AC-0009-006, AC-0009-017,
    AC-0009-025, AC-0009-027–AC-0009-029.
  - Dependencies: T0008-009 and T0009-007.

## Preparation Evidence

Specification, acceptance criteria, plan and task checklist were prepared in
English. Relative links, 26 unique acceptance IDs and five pending task IDs were
validated. No application implementation, application test execution, commits
or pushes were performed as part of documentation preparation.
Implementation/visual verification results will be recorded only after the
corresponding requested work runs.

## Implementation Evidence

T0009-001: generated OpenAPI JSON/YAML were read from an isolated current
backend test run because the running Compose API still served the earlier
contract. All seven OpenApiDocumentationTest cases passed; creation/draft/gallery
fields, UUIDs, timestamps, enum values and the 16-reference limit were reviewed
against the new frontend DTOs. No backend source or real database was changed.

Dedicated frontend DTOs and asynchronous mock creation/draft-upload operations
are implemented. Local file bytes become data URLs; new stones/galleries have
unique numeric IDs and participate in common catalog/detail reads and existing
reservation overlays. Drafts, creations and returned gallery arrays are isolated
from fixture/response mutation, with reset helpers for test ownership.

On Node 24.21.0 and npm 11.19.0, npm run lint, npm run test -- --run (82 tests)
and npm run build passed. Fourteen new boundary tests cover local bytes including
10 MiB, omitted/null/empty references, one/16 ordered photos, duplicate names,
concurrent ID allocation, filtering/pagination/totals, mutable returned data,
fixture immutability, reservations and runtime reset. git diff --check passed.
The existing UI server remains available at http://127.0.0.1:5174/.

At that checkpoint only T0009-001 had been executed. The user subsequently
authorized continuous execution of all remaining tasks. No commits or pushes
were created, and package versions/lockfile were unchanged.

T0009-002: added the feature-owned form, placeholder preview, explicit enum
labels, required/length/calendar validation, field errors and first-invalid
focus. Valid text is preserved and calendar dates become midnight UTC. Fifteen
new form/date tests passed; lint, all 97 tests and build passed. The page shell is
composed during T0009-004 when routing/submission are connected.

T0009-003: connected validated photo batches through the draft API boundary,
ordered previews, count, cover, removal, empty/broken-image fallback and busy
controls. Ten interaction tests cover 16 cumulative photos, the exact 10 MiB
boundary, invalid batch preservation, repeated files, cancellation, completion
order, editing during upload and late completion after leaving. Lint, all 107
tests and build passed. Creation sends the remaining references without
reuploading. This intermediate run used the non-login shell's Node 24.13.0 /
npm 11.6.2; all final checks are repeated on the pinned runtime below.

T0009-004: added direct/trailing-slash creation routes, catalog entry and history
navigation, pending submission guard, confirmation, fresh Add another stone
forms and catalog invalidation without resetting session choices. Twelve new
application cases cover zero/one/16 photos, all readback views, route revisits,
late creation, native modified clicks, matching/nonmatching results and adoption
of an added stone. The prior static-header regression now checks the eight
detail links separately from the newly authorized creation link. The first
integration run caught that obsolete total-link assumption and an incorrect
selector in the new adoption case; both were corrected against the specified
behavior/existing labels. Lint, all 119 tests and build passed. Its intermediate
non-login runtime is also covered by the final pinned-runtime rerun.

T0009-005 (partial): final lint, all 119 tests in 15 files and production build
passed on Node 24.21.0 / npm 11.19.0. git diff --check passed. This final run
verifies the combined T0009-001–T0009-004 implementation on the pinned runtime.
Reviewed all 26 acceptance IDs and recorded evidence individually in
acceptance.md. Updated the UI README with the creation route and runtime-only
mock behavior. No dependency/lockfile/backend changes, commits or pushes.

The existing Vite server is still running at http://127.0.0.1:5174/; creation is
at http://127.0.0.1:5174/stones/new. Creation/trailing-slash routes, the compiled
page module and existing placeholder all returned HTTP 200.

Browser verification is unavailable: the automation inventory contains no
browsers/apps, and both iab and chrome tab creation returned Browser is not
available. Responsive rendering at 1440/1024/768/390/320, real keyboard traversal,
physical refresh/history and reduced-motion display remain pending. Do not mark
T0009-005 complete or claim full visual acceptance until these checks run.

T0009-006: updated spec/plan and AC-0009-008/AC-0009-011 before implementation,
and added AC-0009-027 for the requested layout revision. Replaced the large
creation preview and lower gallery with one upper 16-slot grid. Four columns,
square slots, neutral numbered empty states, occupied-slot cover labels and
accessible removal controls are implemented. Upload state, selection order,
limits and creation requests are unchanged.

Existing tests now check 16 empty/partially occupied/full slots, gallery
placement above the chooser, absence of the large duplicate preview, cover
updates, image fallback, remove-all and fresh-form reset. On Node 24.21.0 /
npm 11.19.0, lint, all 119 tests in 15 files and production build passed;
git diff --check passed. The running Vite server returned HTTP 200 for the
updated gallery module. No commits or pushes were made.

The browser inventory still returns no apps/browsers. The layout revision has
automated/source verification; real viewport verification remains pending under
T0009-005. The server remains at http://127.0.0.1:5174/stones/new.


T0009-007: updated spec/plan and added AC-0009-028 before implementation.
Removed the visible details legend/introduction, static Name/type/size/Biography
helpers and the additional-selection sentence. Removed unused copy styles and
references to deleted help IDs; active errors and admission-date help remain
associated with their controls. Native required markers/validation and the
accessible form name are preserved.

On Node 24.21.0 / npm 11.19.0, lint, all 119 tests in 15 files and production
build passed. Source review confirmed the requested copy and obsolete help IDs
are absent; git diff --check passed. The existing Vite server returned HTTP 200
at http://127.0.0.1:5174/stones/new and remains running. No new browser layout
checks were performed; T0009-005 remains pending. No commits or pushes were made.


T0009-008 (admission-date portion): removed the date input, helper, form state,
validation/reset logic and creation request property. The mock adapter now
assigns the current UTC instant to the response and runtime stone. Existing
form/application tests verify no date input or request property; the controlled
mock clock test verifies UTC precision, ignored legacy input and matching
creation/detail/search timestamps. Obsolete form-date validation scenarios were
replaced with coverage of the revised requirement.

On Node 24.21.0 / npm 11.19.0, lint, all 114 tests in 15 files and production
build passed. Generated current OpenAPI JSON/YAML were captured from isolated
backend test infrastructure; all seven OpenApiDocumentationTest cases passed on
JDK 23.0.2. Creation request properties exclude admissionDate; response schema
retains its date-time property. Four selected StoneCatalogControllerTest cases
passed for creation without a date and ignored past/future/malformed legacy
values, including persistence/detail/search agreement. These targeted checks
are not a full backend regression run. The initial Maven invocation selected
an incompatible JAVA_HOME and was rerun with the pinned JDK explicitly.

The existing server returned HTTP 200 at http://127.0.0.1:5174/stones/new and
remains running. No browser rendering checks, commits or pushes were performed.
This evidence covers the requested date removal; other task portions and
T0009-005 browser acceptance are tracked separately.

T0009-008 (complete): after the requested 25-minute interval, also removed
visible numbering from empty slots while preserving accessible names. Existing
tests assert all 16 empty slots have no visible content. Final pinned-runtime
lint, all 114 tests in 15 files and production build passed for the combined
changes. Creation/draft DTO fields, enums and the 16-reference limit match
current generated OpenAPI; the backend dependency T0008-009 full verification
passed with 205 tests and four Python loader tests. git diff --check passed.

The existing /stones/new server returned HTTP 200 and remains running at
http://127.0.0.1:5174/stones/new. No dependency, migration, real-data population,
commit or push was introduced. Browser inventory still contains no apps or
browsers; T0009-005 remains partial without real viewport/keyboard checks.
