# Stone Shelter UI

React + TypeScript mock-first catalog, stone details and creation. Use Node 24.21.0 and
npm 11.19.0.

```sh
cd stone-shelter-ui
npm ci
npm run dev
```

Open the local URL printed by Vite. To produce a production build:

```sh
npm run build
npm run lint
npm run test -- --run
```

The catalog is at `/stone-shelter/catalog`; clicking a stone photo opens
`/stone-shelter/stones/{id}`. The header's Stone catalog link returns to the
catalog. Direct entry,
browser history and an explicit back link are supported. Catalog filters, sort,
pagination, sidebar and scroll are retained while navigating within the session.
All 30 mock stones are available without the backend or MinIO. Galleries use
`public/placeholder-rock.png`, with zero/one/multiple-photo examples.

Vitest uses jsdom and React Testing Library to verify catalog, navigation,
detail, gallery and reservation behavior. An available stone's details include
`Adopt this stone`: enter arbitrary nonblank name/contact text in the modal and
submit to reserve it. Confirmation stays in the same modal; failures retain the
form and allow manual retry when the stone is still eligible. Reservations and
`Reserved` status are shared by mock reads until a full reload. No backend is
required and no live HTTP reservation requests are made.

Select `Add stone` in the catalog or open `/stone-shelter/add-stone` to create a stone.
Photos are optional; without them the existing placeholder is used. Choose up to
16 JPEG/PNG/WebP photos, up to 10 MiB each, across multiple selections. Photos
appear in a 4 × 4 grid of 16 slots above the chooser and can be removed before creation.
Empty slots have no visible numbers. Creation has no admission-date input;
the backend assigns that timestamp, and the mock mirrors it in its response.
The mock reads selected files locally and returns draft UUIDs; creation sends
details and those references through the API boundary. It always succeeds for
valid form input. Created stones and photos are available in the catalog and
details until a full reload. Admission date is assigned at creation by the
backend (or the mock adapter in this UI); the form has no date input and sends
no admissionDate. There is no live upload, backend write or persistent
browser storage. Feature scope and verification are in
[0009-add-stone-ui](../specs/0009-add-stone-ui/spec.md) and
[acceptance.md](../specs/0009-add-stone-ui/acceptance.md).
Backend photo storage and real reservation persistence are verified independently;
adoption UI scope remains in [0007-adopt-stone](../specs/0007-adopt-stone/spec.md).
Opening `/` or `/stone-shelter` redirects to the catalog. Legacy `/stones/new`
and numeric `/stones/{id}` URLs still work and redirect to the canonical URLs.
Recognized trailing slashes are normalized away. Redirects replace the current
history entry and retain query strings/fragments. Unknown pages show Page not
found; invalid or missing stone identifiers show Stone not found.

The Vite development server serves the SPA entry document on direct UI routes.
An eventual production host must serve `index.html` for these client routes
while serving requested assets normally. The `/stone-shelter` prefix identifies
UI pages; it does not relocate assets or backend API endpoints. Deployment is
outside this feature. Routing scope and evidence are in
[0010-ui-routing](../specs/0010-ui-routing/spec.md) and its
[acceptance criteria](../specs/0010-ui-routing/acceptance.md).
TypeScript 6.0.3 is selected for supported ESLint integration in ADR-0002.
