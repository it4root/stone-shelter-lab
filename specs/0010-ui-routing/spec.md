# Feature 0010: Readable UI URLs and Application Routing

## Status and Goal

Implementation authorized on 2026-10-08 from the user's request and the routing item in
[engineering notes](../../engineering-log/notes.txt). Give the existing UI
pages readable URLs using an application-name prefix and a page path.

Acceptance criteria live exclusively in [acceptance.md](acceptance.md).
Technical decisions are in [plan.md](plan.md); execution boundaries and work
items are in [tasks.md](tasks.md). The user authorized continuous execution of
all remaining tasks in this ticket with tests limited to changed routing and
link behavior. Commits and pushes remain unauthorized.

## Current Behavior

The UI already uses browser history for the catalog at `/`, stone details at
`/stones/{id}` and creation at `/stones/new`. Paths are embedded in page
selection, click handling and individual links. Header labels are static.
This ticket makes routing consistent across the existing pages.

## Canonical URLs

Use the lowercase application slug `stone-shelter` and ordinary pathname URLs,
without hash routing. Use the page names prepared in this ticket.

| Page | Canonical URL |
| --- | --- |
| Stone catalog | `/stone-shelter/catalog` |
| Stone details | `/stone-shelter/stones/{id}` |
| Add a stone | `/stone-shelter/add-stone` |

`{id}` is the stone's existing positive safe integer identifier. Stone names
remain display content, since duplicate names are permitted. No name-to-slug
conversion or new backend lookup is required.

Opening `/` or `/stone-shelter` leads to the canonical catalog URL. Existing
`/stones/new` and numeric `/stones/{id}` links lead to their canonical equivalents.
Accept one trailing slash on recognized routes and normalize it away. These
redirects replace the current history entry so browser Back does not traverse
redirect-only entries. Preserve query strings and fragments during normalization;
this ticket does not introduce query-driven filters or pagination.

## Navigation Behavior

All links to implemented pages use the canonical URLs: catalog card photos,
Add stone, Back to catalog and the creation success View stone action.
Make the existing `Stone catalog` header label a link to the catalog. Other
header labels remain static because their pages do not exist.

Normal same-origin navigation between implemented pages uses browser history
without a document reload. Browser Back/Forward, direct entry and refresh work
for the three pages. Links retain keyboard activation and native modified-click,
new-tab and external-link behavior.

Retain the existing catalog session provider and its filters, sorting, page,
page size, sidebar state and scroll restoration. Details start at the top;
returning to the catalog restores its saved scroll. Keep creation, gallery and
adoption behavior, including a fresh form on creation-page revisit and the
existing runtime-only mock persistence rules.

## Unknown Routes

An unrecognized page path displays an English `Page not found` state with a
canonical `Back to catalog` link and the shared Header/Footer. A malformed
detail identifier or an unknown stone on the details path retains the existing
`Stone not found` state. Never silently substitute the catalog or another stone.

## Boundaries and Contracts

Scope is routing for the three implemented pages. The notes' future admin/public
separation, roles, authentication, backend integration and additional header
pages require separate tickets. Do not add those capabilities here.

Browser page URLs are frontend routes, not new HTTP API endpoints. No controller,
DTO, generated OpenAPI, AsyncAPI or database change is required. Continue to use
the current API boundary and mock adapters. The generated OpenAPI remains the
HTTP API contract source of truth.

Use the current React/TypeScript/Vite stack and routing capabilities where they
satisfy this scope. A deployment host must serve the SPA entry document for UI
paths; document that requirement, but hosting/deployment changes are outside
this ticket.

## Relationship to Existing Specifications

This ticket supersedes only the UI path choices and static `Stone catalog`
header behavior in features [0005](../0005-ui-mock-to-code/spec.md),
[0006](../0006-stone-details/spec.md) and [0009](../0009-add-stone-ui/spec.md).
Their other requirements and recorded delivery evidence remain applicable.
Existing path-specific tests must be updated to the documented route change;
behavior assertions must remain intact.
