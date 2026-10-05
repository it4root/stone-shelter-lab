# Frontend conventions

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
