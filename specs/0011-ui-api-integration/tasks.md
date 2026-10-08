# Feature 0011: Tasks

The user authorized continuous execution of all tasks. Execute sequentially,
verify after each task, and report one line. No commits or pushes are authorized.

- [x] T0011-001 Define the ticket documents and inspect current generated HTTP contracts and implementation boundaries.
- [x] T0011-002 Implement API/mock selection, HTTP transport, environment-based Vite proxy and explicit launch/build scripts; verify adapter/configuration tests.
- [x] T0011-003 Migrate catalog and details to async reads with loading/error/retry and stale-response protection; adapt affected read/navigation tests and verify them.
- [x] T0011-004 Integrate creation/upload/reservation failures and readback, align mock availability, and verify mutation and mock regressions.
- [x] T0011-005 Add focused race/failure/transport integration coverage and run full frontend lint/tests/API and mock builds.
- [x] T0011-006 Verify current generated contracts/backend and isolated real UI-to-API flows; refresh the outdated local API and configure/check the UI proxy, update run documentation and acceptance evidence, check the diff and leave the UI server running.

## Completion Evidence

Final verification and criterion mapping are recorded in [acceptance.md](acceptance.md).
All six tasks are complete. Final checks: 145 frontend tests, lint and API/mock
builds; 213 backend tests; current generated DTO/enum comparison; real adapter
and development/preview proxy smoke; updated local API health/contract and both
UI launches. Browser rendering is unavailable and is not claimed. User edits
outside the ticket were preserved; no commits or pushes were created.
