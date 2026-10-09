# Feature 0013: Tasks

Requirements live in [spec.md](spec.md), technical decisions in [plan.md](plan.md)
and acceptance criteria exclusively in [acceptance.md](acceptance.md).

The user authorized continuous execution of T0013-002 through T0013-005.
Verify and report one line after each task. Do not create commits or push
without explicit authorization.
Any authorized commit subject starts with `0013-multi-filtering-labels:` and
references the full task ID; one task corresponds to one commit.

- [x] T0013-001 Prepare specification, acceptance file, technical plan and bounded task list; validate links, unique/sequential IDs, scope, HTTP requirements and formatting.
- [x] T0013-002 Implement the reusable MultiSelectDropdown with local search, controlled selections, closure/reset behavior, keyboard/focus handling and responsive styles; run focused component checks and frontend lint/build. Depends on T0013-001.
- [x] T0013-003 Integrate dropdowns into CatalogFilters and coordinate sidebar reset, visibility, focus trapping and Escape consumption; preserve existing date/filter semantics and verify focused catalog/sidebar/chat regressions plus frontend lint/build. Depends on T0013-002.
- [x] T0013-004 Implement and place ActiveFilterLabels, size/type removal, applied-date label/clear operation and removal focus management; verify pending/error/empty states, pagination, group counts, date drafts and navigation plus frontend lint/build. Depends on T0013-003.
- [x] T0013-005 Run final focused interaction/transport/regression checks and API/mock builds; inspect responsive/browser flows, record acceptance evidence and limitations, review the diff and leave a verified local UI server running with its URL reported. Depends on T0013-004. Browser inspection was attempted but unavailable; browser acceptance remains pending in acceptance.md.

## Documentation Evidence

T0013-001 created documentation only and passed local link, ID and formatting
checks. Earlier feature documents and user notes were preserved throughout.

## Implementation Evidence

- T0013-002: four component tests, lint and API build passed.
- T0013-003: 47 focused component/catalog/navigation/chat tests, lint and API build passed.
- T0013-004: 43 focused label/catalog/navigation tests, lint and API build passed.
- T0013-005: 81 focused tests across 11 files passed; final focus refinement passed all 20 affected tests again; lint and API/mock builds passed; local catalog HTTP and current served-module checks passed. Browser inspection was unavailable and remains explicitly pending.

Criterion-linked evidence and verification limits are recorded in
[acceptance.md](acceptance.md). The existing mock UI remains running at
http://127.0.0.1:5175/stone-shelter/catalog. No commits or pushes were created.
