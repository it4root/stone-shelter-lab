# Stone Shelter UI

React + TypeScript mock-first catalog and stone details. Use Node 24.21.0 and
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

The catalog is at `/`; clicking a stone photo opens `/stones/{id}`. Direct entry,
browser history and an explicit back link are supported. Catalog filters, sort,
pagination, sidebar and scroll are retained while navigating within the session.
All 30 mock stones are available without the backend or MinIO. Galleries use
`public/placeholder-rock.png`, with zero/one/multiple-photo examples.

Vitest uses jsdom and React Testing Library to verify catalog, navigation,
detail and gallery behavior. The visitor UI does not upload photos or submit
adoption applications. Backend photo storage is verified independently.
An eventual production host must serve `index.html` for the documented client
routes; deployment is outside the current feature.
TypeScript 6.0.3 is selected for supported ESLint integration in ADR-0002.
