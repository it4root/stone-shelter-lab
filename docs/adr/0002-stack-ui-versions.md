# ADR 0002: UI stack versions

Date: 2026-10-03

Status: Accepted; TypeScript changed to 6.0.3 by explicit user instruction.

## Context

[UI bootstrap](../../specs/0002-project-bootstrap-ui/spec.md) requires React,
TypeScript, Vite, React Router, Vitest, React Testing Library and ESLint.
T0002-001 records current stable releases without implementing the frontend.
ADR-0001 covers the backend; this ADR records UI selections separately.

Versions below were read directly from the official npm registry's `latest`
metadata and the Node.js release index. All listed package versions are stable
releases, without prerelease suffixes. Registry tags are research inputs only;
future manifests must contain exact versions and a committed lockfile.

## Decision

Use these versions. TypeScript 6.0.3 is an intentional compatibility selection
instead of the current stable 7.0.2 inventoried in T0002-001.

| Component | Version | Official release metadata |
| --- | --- | --- |
| React | 19.3.0 | [react](https://registry.npmjs.org/react/19.3.0) |
| React DOM | 19.3.0 | [react-dom](https://registry.npmjs.org/react-dom/19.3.0) |
| TypeScript | 6.0.3 | [typescript](https://registry.npmjs.org/typescript/6.0.3) |
| Vite | 8.3.2 | [vite](https://registry.npmjs.org/vite/8.3.2) |
| React Router | 8.4.0 | [react-router](https://registry.npmjs.org/react-router/8.4.0) |
| Vitest | 5.0.3 | [vitest](https://registry.npmjs.org/vitest/5.0.3) |
| React Testing Library | 16.3.3 | [@testing-library/react](https://registry.npmjs.org/@testing-library/react/16.3.3) |
| ESLint | 10.12.0 | [eslint](https://registry.npmjs.org/eslint/10.12.0) |

Use Node.js LTS 24.21.0 with its bundled npm 11.19.0 when implementation starts,
as reported by the [official release index](https://nodejs.org/dist/index.json).
This runtime satisfies the reported Node engine ranges for all packages reviewed.

Supporting package inventory, for the needs of the specified stack:

| Package | Version | Purpose and official metadata |
| --- | --- | --- |
| @vitejs/plugin-react | 6.1.1 | [React integration for Vite](https://registry.npmjs.org/@vitejs/plugin-react/6.1.1) |
| @testing-library/dom | 10.4.2 | [Required peer of React Testing Library](https://registry.npmjs.org/@testing-library/dom/10.4.2) |
| @eslint/js | 10.0.1 | [JavaScript ESLint configuration](https://registry.npmjs.org/@eslint/js/10.0.1) |
| typescript-eslint | 8.71.0 | [TypeScript linting integration](https://registry.npmjs.org/typescript-eslint/8.71.0) |
| @types/react | 19.3.0 | [React TypeScript declarations](https://registry.npmjs.org/@types/react/19.3.0) |
| @types/react-dom | 19.3.0 | [React DOM TypeScript declarations](https://registry.npmjs.org/@types/react-dom/19.3.0) |
| jsdom | 30.1.1 | [DOM environment for Vitest](https://registry.npmjs.org/jsdom/30.1.1); supports Node 24.21.0 |

Compatibility conclusions from published package metadata:

- React DOM requires React `^19.3.0`; React Router requires React and React DOM
  `>=19.2.7`. The selected React pair satisfies both requirements.
- React Testing Library supports React 18 or 19 and requires
  `@testing-library/dom ^10.0.0`; the recorded versions satisfy these peers.
- Vitest accepts Vite `^8.0.0`; the React Vite plugin also accepts Vite `^8.0.0`.
- `@eslint/js` supports ESLint `^10.0.0`; typescript-eslint supports ESLint 10,
  and requires TypeScript `>=4.8.4 <6.1.0`. TypeScript 6.0.3 satisfies that range;
  the previously selected 7.0.2 does not.

Use ESLint's flat configuration with the recommended JavaScript and
typescript-eslint rules for TS/TSX source files. This resolves the identified
linting conflict without changing React, Vite, Node or ESLint versions.

## Consequences

- TypeScript is pinned to a supported stable release rather than the newest
  release. Future upgrades must check typescript-eslint support first.
- After selecting TypeScript 6.0.3, `npm run lint` and `npm run build` both
  passed on Node 24.21.0 and npm 11.19.0. The lint command rejects warnings.
- Peer and engine checks establish declared compatibility only. T0002-002 verified
  the minimal React, TypeScript and Vite skeleton with `npm run build` and a live
  dev-server HTTP check. T0002-003 verified Vitest with jsdom and React Testing
  Library: one application-heading test passed, followed by successful lint and
  build checks. Routing remains unverified.
- T0002-002 used the official Node 24.21.0 archive with bundled npm 11.19.0,
  verified against the official SHA-256 checksum, from temporary storage.
  Node and npm were not installed globally.
- Additional required packages or test environments must be selected before use.

## Alternatives

- Retain TypeScript 7.0.2 and wait for typescript-eslint support: rejected in
  favor of the user's explicit decision to enable supported linting now.
- Ignore peer constraints or force installation: rejected; installation success
  would not establish supported TypeScript linting.
- Use prereleases or floating dependency ranges: rejected by the stable-release
  requirement and the repository's explicit-version rule.
- Implement the UI during version research: outside T0002-001.

## Feature 0014 Frontend Container (2026-10-09)

Use `node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20`
for the local frontend container. Registry manifest inspection confirms amd64
and arm64 support; preserve Node 24.21.0, npm 11.19.0 and the existing lockfile.
Verify both versions in the build rather than installing a different runtime.
The [official Node image inventory](https://hub.docker.com/_/node) lists the
selected concrete tag.

Use the existing Vite API-mode server under the Compose `frontend` profile.
Standalone `npm run dev:api` remains available for host hot updates against the
Docker backend. No additional server package or frontend dependency is required.
