# Feature 0010: Technical Plan

## Inputs

Read [spec.md](spec.md) and [acceptance.md](acceptance.md) before implementation,
along with the constitution, root/UI AGENTS.md,
[ADR-0002](../../docs/adr/0002-stack-ui-versions.md) and
[ADR-0005](../../docs/adr/0005-ui-mock-to-code.md).

## Routing Ownership

Evolve the existing `src/App/navigation` route/navigation code and
`ApplicationPages` composition. Share route constants, the detail URL builder
and path interpretation between navigation and link consumers. Create files
only where separation has a concrete use. App composes Header, the session
provider, application pages and Footer; it does not own parsing or feature data.

The existing browser History API supports this ticket. Keep it and add no
dependency. React Router is inventoried in ADR-0002 but absent from package.json;
its addition is unnecessary for this bounded route change. Keep the existing
lockfile and package versions unchanged.

## Navigation and Page Selection

Resolve canonical paths, redirect aliases, detail failures and unknown pages
explicitly. Apply alias normalization before page selection using history
replacement. Keep location state synchronized with both push navigation and
popstate; use canonical catalog recognition for scroll capture/restoration.

Use shared URL definitions in StoneCard, Catalog, StoneDetailsPage,
AddStonePage and Header. Keep real anchors and existing browser-event guards.
Handle the header catalog link through the same navigation boundary as page
links, without placing feature state inside Header.

Retain CatalogSessionProvider across route transitions. Preserve existing page
mount/reset behavior and catalog invalidation after successful creation.
Reuse the current missing-stone view for detail failures. Add the small unknown
page view within application composition, with existing styling and layout.

## Verification and Documentation

Update route-specific expectations in existing tests and add focused coverage
for aliases, canonical links, unknown pages and header navigation. Keep prior
catalog/detail/create/adoption assertions. Assert observable location/history
and rendered behavior instead of copying path-parsing implementation into tests.

Run lint, only affected routing/link tests and build on the pinned runtime,
as explicitly requested by the user. Reuse an existing
Vite server where possible; check direct routes and required assets, then perform
real browser navigation, refresh, scroll and keyboard checks when available.
Keep the server running and record actual evidence against acceptance IDs.

Update the UI README during implementation to explain canonical routes, legacy
aliases and the host's SPA fallback requirement. No infrastructure, backend or
contract generation work is needed for this frontend-only change.
