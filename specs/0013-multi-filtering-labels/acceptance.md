# Feature 0013: Acceptance Criteria

Criteria are defined exclusively here. Implementation and automated verification
completed on 2026-10-09. Real browser checks remain pending as recorded below.

| ID | Given / When | Expected result | Verification |
| --- | --- | --- | --- |
| AC-0013-001 | A fresh catalog session opens the sidebar | Size and Stone type have closed dropdowns with labelled triggers and zero selected counts; their panels offer the existing three sizes and ten types with explicit English labels | Component tests |
| AC-0013-002 | A dropdown is opened and its search changes | Search receives focus; matching uses trimmed case-insensitive label substrings in original order; empty query restores all options; no matches shows No matching options. | Component and keyboard tests |
| AC-0013-003 | Options are selected, hidden by search, then shown again | Multiple values remain checked; changing a checkbox applies immediately and keeps panel/query open; queries never alter selected values, catalog requests, page or group count | Interaction tests with request assertions |
| AC-0013-004 | Trigger, outside click, focus departure, Escape, sidebar close or Reset filters is used | Closure clears query while retaining selections; sidebar close also closes dropdowns; reset clears selections/dates/errors/queries while retaining sidebar and dropdown expansion | Interaction tests |
| AC-0013-005 | One or more sizes/types are applied | Active filters appears below heading/sort and above results with one group-qualified label per selected value, in size/type option order, with accessible cross buttons; checks/counts/labels agree | Catalog integration tests |
| AC-0013-006 | A size/type label is removed with sidebar closed or its option hidden by search | Only that selection is removed; reopening/revealing the option shows it unchecked; other groups and date drafts/errors remain; normal outside-click/focus-leave query dismissal still applies | Catalog integration tests |
| AC-0013-007 | Applied dates exist, including invalid replacement drafts | Exactly one correctly formatted date label represents the last valid applied range or open bound; invalid drafts never replace it | Date/filter interaction tests |
| AC-0013-008 | The admission-date label is removed | Both applied bounds, drafts and date errors clear; size/type selections remain | Date/filter interaction tests |
| AC-0013-009 | Labels exist during sidebar collapse, catalog loading, failure or successful empty results | Labels remain available and removable; removing the final applied filter hides the region; Reset filters remains in the sidebar | Controlled-promise catalog tests |
| AC-0013-010 | Checkbox changes, label removal, reset, dropdown search or pagination occurs | Changes/removals/reset return to first page and preserve sort/size; search/open/close preserve page; OR/AND, UTC date validation, response totals and active-group badge 0–3 remain correct | Focused existing and new catalog regressions |
| AC-0013-011 | Tab, Shift+Tab, Enter, Space and Escape are used in desktop/mobile filters | Native control navigation works; closed options are unfocusable; Escape returns focus to dropdown trigger without closing sidebar/chat on that keypress; later Escape follows enclosing-panel behavior; outside/focus closure does not steal focus | Keyboard tests and browser inspection |
| AC-0013-012 | A focused label remove button is activated | Focus proceeds to next removal button, otherwise previous, otherwise catalog heading; it never falls silently to document body | Focus interaction tests |
| AC-0013-013 | Catalog/details navigation and Back/Forward occur | Existing applied filters, labels, sort, page size and sidebar session choices are restored; dropdown/query state needs no persistence | Application navigation tests |
| AC-0013-014 | API and mock modes perform filtering | Existing search fields, enum values and pagination are used; option queries/label/open state are absent from payloads; API failures do not fall back to mocks; no backend/schema/dependency changes occur | Transport/integration tests and diff review |
| AC-0013-015 | UI is inspected at desktop, tablet and narrow mobile widths with chat open/closed | Dropdowns fit/scroll, labels wrap, no horizontal overflow; sidebar focus trap/inert/scroll lock/restoration, catalog columns, chatbot interaction and reduced motion remain usable | Responsive browser inspection and targeted regressions |
| AC-0013-016 | Implementation verification finishes | Focused tests, lint and API/mock builds pass; evidence and unavailable checks are recorded honestly; local UI is left running with verified URL; no unauthorized commits/pushes occur | Recorded commands and diff review |

## Evidence Policy

Record automated interaction, transport and actual browser evidence separately.
Use controlled promises for pending/failure scenarios and isolate test state.
Successful HTTP entry responses and jsdom tests do not establish visual layout
or real browser focus behavior. Record any unavailable checks as pending.

## Documentation Status

The specification, plan and task list were prepared on 2026-10-09. The user
subsequently authorized continuous execution of T0013-002 through T0013-005.

## Implementation Evidence — 2026-10-09

Verification used the pinned Node 24.21.0 and npm 11.19.0. The final focused
Vitest selection passed 81 tests in 11 files, with zero failures or skips:

- MultiSelectDropdown and ActiveFilterLabels component tests.
- CatalogMultiSelect, CatalogFilterLabels and existing CatalogPage tests.
- Existing App and ApplicationPages tests.
- Existing StoneChatbotNavigation, admissionDates, mockStonesApi and
  httpStonesApi tests.

Following that run, final review added document focus tracking so that leaving
the reset button for another outside control dismisses a preserved-open
dropdown. All 20 tests in the four affected dropdown/catalog/chat files passed
again. No unrelated suites or backend tests were run.

`npm run lint`, `npm run build:mock` and `npm run build` passed after the final
change. The API build was run last and remains the dist artifact. Existing
assertions were preserved; earlier filter tests now open the dropdown before
selecting or inspecting its checkboxes. No test expectation was removed to
accommodate a failure.

| Criteria | Evidence and status |
| --- | --- |
| AC-0013-001–AC-0013-004 | Passed component/integration tests for exact option sets, local substring search, controlled selections, no-match state, request/page preservation, closure/reset and query disposal |
| AC-0013-005–AC-0013-009 | Passed label order/synchronization, hidden-option and collapsed-sidebar removal, last-valid-date retention, date clear, deferred/error/empty states and obsolete response tests |
| AC-0013-010 | Passed existing OR/AND/date/sort/pagination regressions and new removal/count checks; totals still come from API response metadata |
| AC-0013-011–AC-0013-012 | Automated focus, Escape isolation, sidebar trap/restoration and label-removal focus checks passed; actual native keyboard/browser inspection remains pending |
| AC-0013-013 | Passed existing session/navigation checks and new Back/Forward label/query tests |
| AC-0013-014 | Passed actual UI-to-HTTP-adapter tests with intercepted fetch, unchanged payload assertions and API failure/no-mock-fallback checks; mock regressions and both builds passed; backend/contracts/dependencies are unchanged |
| AC-0013-015 | Automated sidebar/chat coordination regressions passed; responsive layout, native focus and reduced-motion browser inspection remain pending |
| AC-0013-016 | Lint, focused tests, both builds, document/diff checks and local HTTP/module checks passed; browser limitation is recorded; no commits/pushes were created |

## Local Delivery and Browser Limitation

The existing mock development server was reused and left running at
http://127.0.0.1:5175/stone-shelter/catalog. The catalog entry returned HTTP 200;
the served CatalogPage module contains the new ActiveFilterLabels integration
and conditional filter rendering. These are HTTP/module checks, not rendered
UI evidence. API-mode transport was exercised with intercepted fetch, not a
live backend database; no real database was populated or changed.

Computer-use inventory returned no available apps or browsers. Opening the
in-app browser returned `Browser is not available: iab`. Consequently, the
planned 1440/768/390/320 pixel browser checks could not run. No visual, native
keyboard or real-browser acceptance pass is claimed. AC-0013-015 and the browser
portion of AC-0013-011 remain pending.
