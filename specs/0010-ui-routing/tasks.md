# Feature 0010: Tasks

The user authorized all remaining tasks in this ticket continuously on
2026-10-08, with test execution limited to changed routing/link behavior.
After each implementation task, run its verification and report one line using
the complete task ID. No commits or pushes are authorized. If later authorized, commit
subjects start with `0010-ui-routing:` and reference the complete task ID.

- [x] **T0010-001 — Prepare the routing ticket.**
  - Read the constitution, repository/UI rules, related navigation requirements
    and linked engineering notes.
  - Write the specification, separate acceptance criteria, technical plan and
    task checklist in English; identify proposed URL names and existing behavior.
  - Verification: validate links, unique IDs and whitespace; do not claim
    application tests or implementation as part of preparation.
  - Dependencies: none.

- [x] **T0010-002 — Implement canonical application routing and links.**
  - Implement shared routing definitions, alias normalization, location/history
    handling and explicit application page selection according to spec.md.
  - Update all implemented-page links and the header catalog entry; preserve
    session, scroll, page lifecycle and native anchor behavior.
  - Update the UI README and meaningful route/navigation regression tests.
  - Verification: pinned-runtime lint, affected routing/link tests, production build,
    whitespace/scope review and local server response; leave the server running.
  - Acceptance references: AC-0010-001–AC-0010-010.
  - Dependencies: T0010-001.

- [ ] **T0010-003 — Verify routing acceptance in the browser (partial; browser unavailable).**
  - Exercise direct entry, refresh, history, native links, catalog state/scroll,
    errors and creation/detail/adoption regressions through the new routes.
  - Record actual evidence by acceptance ID, keeping unavailable checks pending.
  - Report verification results and the running local UI URL.
  - Acceptance references: AC-0010-001–AC-0010-010.
  - Dependencies: T0010-002.

## Preparation Evidence

2026-10-08: inspected existing routing and link consumers and prepared this
draft ticket. Application implementation has not started. Application tests,
commits and pushes were not performed during documentation preparation.
Documentation checks passed: four Markdown files, 11 valid local links,
10 unique acceptance IDs and three unique task IDs, with valid final newlines
and no trailing whitespace. `git diff --check` passed. Only the new ticket
directory is present in the working-tree changes.

## Implementation Evidence

T0010-002: completed shared path definitions/resolution, canonical links,
history replacement for root/legacy/trailing-slash entry, native-link guards,
header catalog navigation and explicit page/stone error states. Existing catalog
session ownership, creation invalidation and page lifecycles are preserved.
App remains composition-only; no routing dependency was added. Creation success
focus now runs in a layout effect before paint after a selected regression
exposed the former timing issue; its assertion was retained unchanged.

On Node 24.21.0 / npm 11.19.0, all 31 selected routing/link checks passed across
five affected files, with 23 unrelated cases excluded. The initial single focus
failure was fixed in code and only the eight affected creation/navigation cases
were rerun. Final lint, production build and whitespace checks passed. No full
frontend or backend suite, commits or pushes were run.

T0010-003 (partial): audited all ten acceptance IDs and recorded automated,
source and HTTP evidence in acceptance.md. Canonical pages, legacy creation,
changed modules and the existing placeholder return HTTP 200 with the expected
content types from the reused Vite server. The server remains running at
`http://127.0.0.1:5174/stone-shelter/catalog`.

The browser inventory is empty; both iab and chrome creation attempts failed
with Browser is not available. Real direct entry/refresh, Back/Forward,
keyboard/new-tab and scroll checks remain pending. This task is not marked
complete without its required browser evidence.
