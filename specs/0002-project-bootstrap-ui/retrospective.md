# UI bootstrap retrospective

## Completed

- Recorded UI versions and compatibility in ADR-0002 (T0002-001).
- Created a minimal React + TypeScript + Vite skeleton displaying Stone Shelter,
  with a lockfile, local startup instructions and frontend conventions (T0002-002).
- Added Vitest, jsdom and React Testing Library with one application-heading
  test and explicit DOM cleanup (T0002-003).

## Corrections

- The initial latest-version inventory exposed an unsupported TypeScript and
  typescript-eslint pairing. After explicit approval, selected a supported
  TypeScript release and added ESLint configuration; version details remain
  in ADR-0002.
- The first commit attempt failed the mandatory test check because the `test`
  script was missing. Added the minimal test setup instead of bypassing the check.
- Extracted the existing markup into `App` for testing without changing behavior;
  ignored frontend dependencies and build output in the root `.gitignore`.

## Verification and lessons

- Local dev-server startup, TypeScript checking and production build passed.
  Before commit, lint, the single test and build all passed.
- Check compatibility before treating latest releases as a usable stack.
  Keep version decisions explicit and do not force incompatible installations.
- Verify observable application behavior and clean up test state. Keep routing,
  styling and backend integration outside the assigned skeleton tasks.
