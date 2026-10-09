# Feature 0013: Searchable Multiselect Filters and Removable Labels

## Goal

Make catalog filters more compact and make applied selections visible above the
catalog. Replace the exposed size/type checkbox groups with dropdowns supporting
multiple selections and search inside each dropdown.

## Scope

- Refactor the existing Size and Stone type controls in the filter sidebar.
- Display removable labels for applied filters above catalog results.
- Keep the existing admission-date inputs, matching rules, pagination, sorting,
  catalog session and API/mock data boundary.
- Use the existing React/TypeScript stack and styles without new dependencies.
  All interface text is English.

## Searchable Multiselect Dropdowns

Each group has a labelled button showing the group name and selected-value
count, including zero. Its panel is initially closed. Opening it reveals a
labelled search input and the group's options as labelled native checkboxes.
Size offers Small, Medium and Large. Stone type offers all ten existing contract
values, using the existing explicit English presentation mappings and their
order. Do not introduce additional filter values.

Search matches a case-insensitive substring of the displayed option label,
ignoring leading/trailing search whitespace. An empty query shows every option.
Keep the original option order. A query with no matches shows
`No matching options.`; it does not imply an empty stone catalog.

Searching only narrows the visible options. It does not change selections,
catalog requests, results, page, sort, page size or active-group count. Selected
options hidden by the query remain selected. Checkbox changes apply immediately
and keep the panel and query open so the user can select several options.
There is no Apply button.

Close a panel by toggling its button, clicking outside it, moving keyboard focus
outside it or pressing Escape. Closing clears its query without clearing its
selections. Closing the sidebar also closes its dropdowns and clears queries.
Reset filters clears queries along with the existing applied filters and date
drafts/errors; it preserves sidebar expansion and any currently open dropdown.
Dropdown/query state is temporary UI state and needs no navigation or reload
persistence. Applied filters retain the existing catalog-session behavior.

## Applied Filter Labels

Place an `Active filters` region below the catalog heading/sorting controls and
above the results/loading/error/empty state. Render it only when there are
applied filters. It remains visible when the sidebar is closed and during
loading, empty results and request failures. Labels represent the current
applied selection, rather than a previous response or invalid date drafts.

Show one label per selected size and type. Include the group name, for example
`Size: Small` and `Stone type: Granite`. Order size labels first, then type labels,
using the corresponding option order. Each label has a visible cross button
with an accessible name such as `Remove size Small` or `Remove stone type Granite`.
Removing a label deselects only that value, including when the sidebar is closed
or the option is hidden by a search query.

Show one admission-date label after size/type labels when either applied date
bound exists. Use `Admission date: YYYY-MM-DD to YYYY-MM-DD`,
`Admission date: from YYYY-MM-DD` or `Admission date: through YYYY-MM-DD` as
appropriate. Its cross button is named `Remove admission date filter` and clears
both applied bounds, both date drafts and their validation error. Removing a
size/type label preserves date drafts/errors and the last valid applied range.
Label removal does not itself edit dropdown queries; normal outside-click and
focus-leave closure still clears the query when interacting outside a dropdown.

Derive dropdown checks, counts and labels from the same applied filter state.
Do not maintain a second collection of selected labels. Removing the last
selection in a group removes that restriction. Removing the last applied filter
hides the region. The existing Reset filters button stays inside the sidebar.

## Preserved Catalog Behavior

Selections within a group use OR; active groups use AND. Empty groups impose no
restriction. Apply availability filtering and selected filters before sorting
and pagination, with totals coming from response metadata.

A checkbox change, label removal or reset returns to the first page and retains
sort and page size. Merely opening, closing or searching a dropdown preserves
the page. The collapsed-sidebar badge still counts applied groups from zero to
three, independently of each dropdown's selected-value count.

Keep the existing inclusive UTC date semantics and validation. Invalid date
drafts retain the last valid applied range and its label until corrected,
removed or reset. Preserve applied filters across existing SPA navigation and
Back/Forward through the catalog session provider. No new browser storage or
URL query state is introduced.

## Keyboard, Focus and Responsive Layout

Use semantic buttons, inputs, checkboxes and group labels, visible focus, and
expanded/control relationships for dropdown triggers. Enter/Space activates a
trigger; opening moves focus to its search input. Tab/Shift+Tab follow native
control order and Space toggles focused checkboxes. Closed panels are hidden
and unfocusable.

Escape closes the focused open dropdown and returns focus to its trigger. That
same keypress must not also close the mobile filter sidebar or chatbot. A
subsequent Escape uses the existing enclosing-panel behavior. Outside-click or
focus-leave closure must not steal focus from the user's next target.

After keyboard removal of a label, move focus to the next remove button, or the
previous one if there is no next label. If no labels remain, use the catalog
heading as a programmatically focusable fallback.

Dropdowns must fit the sidebar width and allow their option lists to scroll
within the available viewport. Labels wrap onto additional lines without
horizontal page overflow. Preserve desktop sidebar behavior, mobile overlay
focus trapping, inert background, scroll locking, focus restoration and reduced
motion. Preserve catalog/chatbot layout and interactions from feature 0012.

## HTTP Contract Requirements

Generated backend `/v3/api-docs` and `/v3/api-docs.yaml` remain the HTTP contract
source of truth. Reuse POST `/api/v1/stones/search` with the existing filter,
page, size and sort request and the existing paginated response. Send existing
`stoneSizes`, `stoneTypes`, `admissionDateFrom` and `admissionDateTo` fields only
for these UI filters. Dropdown queries, label text and open state are never
included in the request.

Keep existing routes, schemas, enums, statuses, ProblemDetail errors and
AVAILABLE-only catalog behavior. Use the same UI controls in API and mock modes;
API errors retain the existing retry behavior without mock fallback. No backend,
generated-contract, database, Liquibase, Kafka or AsyncAPI change is required.
Do not add a handwritten HTTP contract.

## Relationship to Existing Features

This feature supersedes the exposed size/type checkbox presentation in
[feature 0005](../0005-ui-mock-to-code/spec.md) and
[ADR-0005](../../docs/adr/0005-ui-mock-to-code.md). It adds removal of individual
applied filters outside the sidebar; bulk reset remains inside it. Their other
filter and sidebar requirements remain applicable.

Preserve session/navigation behavior from
[feature 0010](../0010-ui-routing/spec.md), API/mock behavior from
[feature 0011](../0011-ui-api-integration/spec.md), and chatbot behavior from
[feature 0012](../0012-stone-chatbot/spec.md). Earlier documents and historical
verification records are not rewritten by this documentation task.

## Out of Scope

Additional filter groups, remote option search, catalog text search, option
creation, select-all controls, Apply buttons, favorites, authentication, backend
changes, persistence, dependency upgrades and unrelated UI refactoring.

## Acceptance and Execution

Acceptance criteria live exclusively in [acceptance.md](acceptance.md).
Technical decisions live in [plan.md](plan.md); bounded implementation tasks
live in [tasks.md](tasks.md). Documentation preparation does not authorize
implementation, commits or pushes.
