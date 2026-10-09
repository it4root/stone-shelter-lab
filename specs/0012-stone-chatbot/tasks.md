# Feature 0012: Tasks

The user authorized continuous execution of T0012-002 through T0012-006.
Verify and report one line after each task. Run tests only for the new chatbot
functionality and its integration boundaries; retain lint/build verification.
No commits or pushes without explicit authorization.

Acceptance criteria live only in [acceptance.md](acceptance.md); requirements
and technical decisions live in [spec.md](spec.md) and [plan.md](plan.md).

- [x] T0012-001 Define the feature specification, acceptance file, technical plan and bounded task list; check document links, task IDs, HTTP requirements and consistency with the agreed scope.
- [x] T0012-002 Implement StoneChatbotController/shared DTOs and the fixed response; document generated OpenAPI, reflect the narrow authorized stub exception in architecture coverage, and verify focused controller/validation/contract/architecture checks. Depends on T0012-001.
- [x] T0012-003 Add frontend chatbot DTOs and API/mock adapters through the existing transport/mode boundary; verify payloads, fixed responses, empty results, response failures and no API-to-mock fallback. Depends on T0012-002.
- [x] T0012-004 Implement the stable shared chat provider above page switching, UUID lifecycle, request snapshots, pending guards and manual retry; verify preservation across navigation/collapse and single completion of deferred requests. Depends on T0012-003.
- [x] T0012-005 Implement and integrate the responsive launcher/panel, greeting/prompts, composer, history, stone links and accessibility; remove the reserved-only catalog chat placeholder, preserve existing page/modal behavior, and verify widget/navigation regressions plus frontend lint/build. Depends on T0012-004.
- [x] T0012-006 Run final module verification, generated-contract and actual API/mock smoke checks, inspect responsive/browser flows, record acceptance evidence and remaining limitations, review the diff and leave the local UI server running with its URL reported. Depends on T0012-005.

## Documentation Evidence

T0012-001 produced documentation only; implementation was subsequently
authorized and completed as T0012-002 through T0012-006.

Documentation checks passed on 2026-10-09: all four documents are in English,
local Markdown links resolve, task and acceptance IDs are unique/sequential,
only the documentation task is complete, and no trailing whitespace was found.
Existing source files, earlier feature documents and user notes were preserved.

## Implementation Evidence

Focused verification passed: 20 backend tests (including actual API/UI transport),
30 frontend tests, lint and API/mock builds. Acceptance evidence and browser
limitations are recorded in [acceptance.md](acceptance.md). No unrelated tests
were run. The mock UI remains at http://127.0.0.1:5175/stone-shelter/catalog.
No commits or pushes were created.
