# Stone Shelter UI

Minimal React + TypeScript skeleton for T0002-002. Use Node 24.21.0 and npm 11.19.0.

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

Vitest uses jsdom and React Testing Library to verify the application heading.
Routing and application styling are outside these skeleton tasks.
TypeScript 6.0.3 is selected for supported ESLint integration in ADR-0002.
