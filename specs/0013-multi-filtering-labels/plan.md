# Feature 0013: Technical Plan

## References and Boundaries

Implement [spec.md](spec.md) against [acceptance.md](acceptance.md), following the
constitution, root/frontend AGENTS.md, pinned stack and
[ADR-0005](../../docs/adr/0005-ui-mock-to-code.md). This feature is frontend-only.
Reuse the current React, TypeScript, CSS and testing dependencies.

## Components and Ownership

Create `MultiSelectDropdown` under
`src/components/Common/MultiSelectDropdown`, with colocated CSS/tests. It accepts
typed options, group label, selected values and a change callback. It owns only
query/open/focus state, with no domain data, API access or catalog state.
Use a disclosure button, a labelled search input and native checkboxes, rather
than menu/listbox roles with a different keyboard contract.

Adapt feature-owned `CatalogFilters` to supply Size/Stone type options from
existing enum types and presentation mappings. Keep admission-date inputs and
reset here. Clear queries on close and reset using an explicit UI reset signal
or component lifecycle; do not duplicate selected values into local state.

Create `ActiveFilterLabels` under
`src/features/catalog/components/ActiveFilterLabels`, with colocated CSS/tests.
It receives applied filters and removal callbacks, derives label presentation
and handles focus after removal. Compose it in the catalog content below the
heading/sort, independent of sidebar expansion and request status. Use a
programmatically focusable catalog heading as the final removal focus target.

Keep applied filters in existing `useCatalog`/`CatalogSessionProvider`. Reuse
size/type change handlers for removals. Add a focused date-clear operation
where needed to clear applied bounds and invalid drafts/errors together.
Use the existing pagination-reset path and derive counts rather than storing
labels/counts. No new provider, service, global store or route is needed.

## Dropdown and Sidebar Coordination

Opening focuses search. Escape closes only the active dropdown, marks the event
handled and restores its trigger focus. Coordinate document-level enclosing
Escape handlers, including `FilterSidebar`, so they respect the handled event
and do not also dismiss enclosing panels. Preserve existing behavior when no
dropdown handles Escape. Outside-click/focus-leave closure does not restore
trigger focus over the user's new target.

Unmount or otherwise reset dropdown presentation when the sidebar closes so
hidden controls cannot keep focus/open state. Keep open/query state local;
catalog selections survive through the existing provider. Ensure the mobile
sidebar focus trap includes only currently visible enabled controls, with
dropdown search and checkboxes included while open. Constrain option scrolling
to available viewport space; retain existing sidebar animations/reduced motion.

## Data Boundary

Continue using `getCatalogStones` and the existing API/mock adapters. Queries
filter supplied option labels locally and never enter `StoneSearchFilter`.
Do not change DTOs, backend sources, OpenAPI generation, storage or infrastructure.
Verify payloads through existing frontend transport tests; this work requires
no new handwritten contract or backend test suite.

## Verification Strategy

Each authorized implementation task runs focused Vitest/Testing Library checks
for its changed behavior, followed by frontend lint/build where applicable.
Report one line after each task; stop at the requested task boundary.

At delivery run lint, the explicit set of relevant dropdown, catalog, date,
navigation, sidebar/chat coordination and transport tests, then API and mock
builds using pinned runtimes. Broaden testing only if changes or failures show
additional affected behavior. Do not weaken unrelated assertions or rewrite
requirements to obtain passing results. If a commit is separately authorized,
the frontend AGENTS.md full pre-commit checks still apply.

Inspect browser behavior at 1440, 768, 390 and 320 pixel widths with multiple
labels, a scrolled dropdown and chatbot open/closed. Check real focus, Escape,
mobile overlay and overflow. Record criterion-linked evidence and limitations
in acceptance.md. Reuse and verify a local UI server, leave it running and
report its URL. Documentation-only preparation requires document validation,
not application tests or server startup.
