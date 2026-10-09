# Feature 0012: Technical Plan

## References and Boundaries

Implement [spec.md](spec.md) against [acceptance.md](acceptance.md), following the
root/module AGENTS.md files, constitution, pinned stack ADRs and
[ADR-0005](../../docs/adr/0005-ui-mock-to-code.md). This plan introduces no
dependencies or infrastructure. The user subsequently authorized continuous
implementation of all remaining tasks with chatbot-focused tests only.

## Backend Stub

Add StoneChatbotController under lab.stoneshelter.controllers and the four
specified shared DTO types under lab.stoneshelter.shared. Use UUID binding,
Bean Validation including nested @Valid and the existing exception handler.
Return the constant response directly. Keep fixed values independent of the
request; do not introduce application processing layers.

Reflect the explicitly authorized controller-construction exception in
architecture coverage only for StoneChatbotController. Preserve the existing
construction/delegation restrictions for all other controllers and the ban on
entity/repository/mapper access for this stub. Do not remove an architecture
assertion merely to make implementation pass.

Generate schemas from MVC annotations/shared DTOs and update focused generated
JSON/YAML tests. No handwritten contract file or migration is needed.

## Frontend Data Boundary

Add contract DTOs under src/api/dto and a chatbot API boundary under src/api,
reusing the existing HTTP client, ApiError and mode selection. Put the explicit
mock adapter under src/mocks/api; keep API mode free of mock fallback. Validate
the small response shape consistently with existing transport conventions.

Use native crypto.randomUUID for the session identifier. No UUID package or
browser persistence is needed. If a frontend message-role enum is introduced,
place its named type in its own PascalCase file under src/enums.

## Stable Chat Session

Place ChatSessionProvider and its state/hooks under src/features/stone-chatbot,
above ApplicationPages, without a pathname key. It owns request execution and
stable state. Keep App limited to composition; use feature-owned components with
PascalCase directories and colocated CSS/tests.

Use existing page-route resolution to derive context at submission. Store the
failed/pending payload as a snapshot for retry. Synchronous pending guards must
prevent duplicate submissions even before React rerenders. Collapse/route
switches affect presentation only. Actual provider disposal must avoid stale
state updates. Retain structured assistant payloads instead of reducing them to
text strings.

Keep one stable visible chat widget where practical. Coordinate its catalog
desktop slot with the existing PageLayout using presentation props/slots rather
than putting feature state in Common. Hide the widget on other pages while the
provider continues handling requests. Reuse canonical links and existing SPA
navigation; do not add a router, store library or forwarding-only service.

## Widget and Layout

Implement launcher, panel, history, quick prompts and composer as feature
components as needed. Use the supplied bitmaps as visual references without
generating new assets. Keep plain-text messages and named stone links; use
existing styles/tokens for green accents, borders and spacing.

Handle panel focus, Escape, concise live announcements, internal scrolling and
reduced motion. Preserve existing modal priority and filter behavior. Keep
desktop catalog at four columns and fit the panel to narrow viewports.

## Verification Strategy

Verify each authorized task with focused checks and report one line afterward.
For backend changes use MVC/architecture/generated-contract checks that exercise
this feature; use existing test infrastructure and never H2. For frontend changes
use Vitest/Testing Library with controlled promises, then npm run lint and
npm run build. Avoid unrelated full-suite reruns after every task.

At delivery, run ./mvnw verify with an explicit chatbot test selection for the
backend and npm run lint, explicitly selected chatbot Vitest files,
npm run build and npm run build:mock for the frontend using pinned runtimes.
Do not run unrelated test suites. Inspect current generated OpenAPI and exercise the actual
chat API/transport. Inspect UI behavior at desktop, tablet and mobile widths,
including pending navigation and link navigation in mock mode. Record results
against criterion IDs in acceptance.md. Do not seed the real database; use
existing isolated infrastructure when needed. Reuse a local UI dev server, keep
it running and report its verified URL. Deployment/commits/pushes remain outside
authorization.

## Deferred Architecture

Future Spring AI work will replace only the fixed backend handling with the
normal controller/service architecture. Session ownership, full structured
history, bounded model memory, JDBC persistence and reload restoration require
their own design/specification. Do not add their classes, tables, endpoints or
configuration during this feature.
