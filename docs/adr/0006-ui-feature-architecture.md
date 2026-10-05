# ADR 0006: Feature-oriented React architecture

Date: 2026-10-05

Status: Accepted by the user before implementation of T0005-012.

## Context

The catalog needs an organization that supports future services, server data and
shared client state. Common/Content currently owns catalog pagination and data
access, mixing shared layout and feature behavior. The user accepted the proposed
structure and requested refactoring under these rules.

## Decision

Organize UI by feature, keeping related components, hooks, services and state
near each other. Keep reusable domain UI separate from feature-specific UI.
Each component retains its own PascalCase directory with implementation, styles
and tests colocated where applicable.

The accepted target structure is:

```text
src/
├── App/
│   ├── App.tsx
│   ├── App.test.tsx
│   ├── providers/
│   └── store/
├── components/
│   └── Common/
│       ├── Header/
│       ├── Footer/
│       ├── PageLayout/
│       └── Pagination/
├── features/
│   └── catalog/
│       ├── components/
│       │   ├── CatalogPage/
│       │   └── Catalog/
│       ├── hooks/
│       │   └── useCatalog.ts
│       ├── services/
│       │   └── catalogService.ts
│       └── state/
│           └── catalogReducer.ts
├── domain/
│   └── stone/
│       ├── components/
│       │   └── StoneCard/
│       └── presentation/
│           └── stoneLabels.ts
├── api/
│   ├── httpClient.ts
│   ├── stonesApi.ts
│   └── dto/
│       ├── StoneSearchResponse.ts
│       └── StonesSearchResponse.ts
├── enums/
│   ├── StoneType.ts
│   ├── StoneSize.ts
│   └── AdoptionStatus.ts
├── mocks/
│   ├── data/
│   │   └── stones.ts
│   └── api/
│       └── mockStonesApi.ts
└── styles/
    ├── global.css
    └── tokens.css
```

Create folders/files only when they have an implemented responsibility. The
structure reserves architectural locations, not permission to implement future
features or add dependencies.

| Layer | Responsibility |
| --- | --- |
| CatalogPage | Compose the screen and connect data/actions to UI |
| Catalog, StoneCard | Render props and invoke callbacks |
| useCatalog | Own pagination parameters and, when asynchronous fetching exists, loading/error state |
| catalogService | Application operations requiring processing or multiple requests |
| stonesApi | Data-access boundary returning contract DTOs; HTTP when backend integration is implemented |
| httpClient | Shared HTTP configuration, status handling and ProblemDetail handling when HTTP exists |
| mocks/api | Substitute the data source; components do not know about fixtures |

Common PageLayout handles placement only. It does not own catalog data or state.
App only composes the top-level structure. UI components do not directly import
mock datasets. API DTOs remain separate from fixtures and domain enum types.
Keep explicit enum presentation mappings in domain/stone/presentation.

Services are not mandatory forwarding layers. A hook can call the API directly
for one simple operation. Add a service only when it owns application logic;
do not duplicate backend business rules in frontend services.

### State Rules

- Keep state near its consumers. Avoid redundant state and do not store values
  that can be derived from existing state or response metadata.
- For the current catalog, keep page and size in useState inside useCatalog.
  Do not add a global store for these two local values.
- As feature transitions become more complex, use useReducer. Add Context when
  distant consumers need the same state. A custom hook shares logic, not a
  singleton state instance.
- Separate server state from client UI state. On backend integration, choose
  TanStack Query for server data, or RTK Query if Redux Toolkit is selected.
  Do not maintain duplicate copies of server data in a client store.
- When shared client state requires a store, keep feature slices with features
  and assemble the store and providers under App/store and App/providers.
- After routing is introduced, consider URL state for page, size and filters
  so links can be shared and browser Back restores navigation.

For this refactoring, split PageLayout and CatalogPage, isolate DTOs and mocks,
extract useCatalog, move styles beside components and introduce shared CSS tokens.
Retain synchronous local pagination, all existing behavior and the existing
stack. Do not implement HTTP, new providers, services, stores or routing yet.

## Consequences

Layout is reusable without catalog dependencies. Feature logic, DTOs, mocks and
presentation each have a defined location. Future HTTP and store integration
have explicit boundaries without speculative implementation today.

This supersedes ADR-0005's placement of Content under Common and Catalog and
StoneCard directly under components. Existing enum and PascalCase rules remain.
Mock API selection is local-only until backend integration is specified.

## Alternatives considered

- Global folders for all hooks/services/state: rejected in favor of feature cohesion.
- Keep catalog behavior in Common/Content: rejected because it couples layout to a feature.
- Add a global store or service for every API operation now: deferred until needed.
- Add a query library before HTTP integration: deferred until server state exists.

## References

- [Redux Style Guide](https://redux.js.org/style-guide/): feature-based organization.
- [React state structure](https://react.dev/learn/choosing-the-state-structure): avoid redundant state.
- [React custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks): reuse stateful logic.
- [React reducer and context](https://react.dev/learn/scaling-up-with-reducer-and-context): scale shared state.
- [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview): server-state lifecycle.
