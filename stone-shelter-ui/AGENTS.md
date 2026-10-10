# Frontend conventions

## Human-only directory: engineering-log

The repository's entire `engineering-log/` directory is forbidden to every agent
without exception: no reading, listing, indexing or modification through any tool,
attachment, Git history, alias, symlink, copy or delegation. Exclude it and all
descendants from searches and automation. Only a human working manually may
access or change it; no request or task authorizes an exception. Never weaken,
remove or bypass this rule. Follow the full policy in the root AGENTS.md.

Read the root AGENTS.md, constitution, current feature spec, tasks and ADR-0002.

- Use exact versions from ADR-0002 and keep package-lock.json in Git.
- Install reproducibly with npm ci on Node 24.21.0 and npm 11.19.0.
- Implement only the assigned task; do not add business features or API calls.
- Keep the skeleton minimal; no demo assets or UI frameworks.
- Verify changes with npm run lint and npm run build; check npm run dev for startup changes.
- Check typescript-eslint compatibility before upgrading TypeScript.
- Do not create commits or push unless explicitly requested.
## Pre-commit verification

Before creating any commit that includes changes to `stone-shelter-ui`, run:

```bash
npm run lint
npm run test -- --run
npm run build
```

All three commands must complete successfully.

If any command fails:
- do not create the commit;
- fix the issue if it is within the current task scope;
- rerun all three verification commands;
- if the failure cannot be fixed within the current task scope, stop and report the failure instead of committing.

Never skip these checks unless explicitly instructed to do so.


- Mock data must never own API/domain types.
- UI components must not import mock datasets directly.
- Mocking must happen at the API/data-source boundary.
- App must only compose top-level application structure.
- Reusable domain UI elements must be separate components.
- Pagination UI must use response metadata, including totalElements,
  rather than deriving totals from current page content.
- API enum values must not be formatted with generic string manipulation;
  use explicit presentation mappings.
- Use PascalCase for React component names and their directories. Each component
  lives in a directory matching its name, with its implementation named
  `{ComponentName}.tsx` (for example `StoneCard/StoneCard.tsx`).
- Use PascalCase for component grouping directories too. Shared page components
  belong under `src/components/Common` (for example `Common/Header/Header.tsx`).
- After frontend verification, keep the local UI development server running unless
  the user explicitly requests otherwise. Reuse an existing server when possible,
  verify that it responds and report its URL.
- Define every frontend enum as a separate named type in its own file under
  `src/enums`, using PascalCase for the type and filename (for example
  `StoneType.ts`, `StoneSize.ts` and `AdoptionStatus.ts`). DTOs, components and
  presentation mappings must import these types. Do not declare enum values
  inline in DTO fields or duplicate their definitions in components or mocks.
  Preserve the exact enum values specified by the generated backend contract.

## Feature architecture

- Follow [ADR-0005](../docs/adr/0005-ui-mock-to-code.md). Organize feature
  components, hooks, services and state under src/features/{feature}.
- Keep reusable domain UI and presentation under src/domain/{domain}; common
  layout/UI under src/components/Common must not own feature data or state.
- Keep API access and DTOs under src/api; fixtures and mock adapters under
  src/mocks. Components use feature hooks/API boundaries, not mock fixtures.
- Colocate component CSS and tests with components. Shared global styles and
  design tokens live under src/styles.
- Services must own application logic; do not create forwarding-only layers.
  Keep local state local and separate server data from shared client state.
- Create services, stores, providers, HTTP clients and routing only when required
  by an authorized feature; their target locations do not mandate empty files.
