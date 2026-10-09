# Feature 0012: Acceptance Criteria

Criteria are defined exclusively here. Automated and HTTP verification passed
on 2026-10-09; browser-rendering limitations are recorded below.

| ID | Given / When | Expected result | Verification |
| --- | --- | --- | --- |
| AC-0012-001 | A valid chat request is submitted with different UUIDs, messages and page contexts | POST /api/v1/chat/messages returns 200 with exactly the specified fixed text and ordered Mars (1), Luna (3) references, without AI, catalog lookups or server storage | Focused controller tests |
| AC-0012-002 | Request fields/JSON are invalid | Missing/null conversationId or message, invalid UUID/JSON, blank message, message exceeding 2000 characters and stoneId outside 1–9007199254740991 return 400 ProblemDetail; optional/null context and stoneId are accepted | Boundary tests including limits |
| AC-0012-003 | Generated OpenAPI JSON/YAML is inspected | New route, dedicated request/response/nested schemas, UUID format, constraints, nullable context, 200 response, 400 ProblemDetail and stub semantics match spec.md; no handwritten OpenAPI is introduced | Generated contract tests/review |
| AC-0012-004 | Backend source and architecture are checked | Only the stub controller/shared DTOs and focused tests are added; DTO construction exception applies only to StoneChatbotController; other controller restrictions remain; no services/mappers/repositories/entities/dependencies/migrations are added | Architecture coverage and diff review |
| AC-0012-005 | A fresh application session opens catalog or details | A collapsed green launcher appears; opening shows an English demo panel, one local greeting, four specified quick prompts and composer; opening alone makes no HTTP request | Widget tests and browser inspection |
| AC-0012-006 | Launcher, close button, Escape or viewport size changes are used | Open/close controls work; messages/draft/UUID remain; hidden controls are unfocusable; focus enters the composer and returns to launcher on explicit close; responsive resizing preserves state | Keyboard and interaction tests |
| AC-0012-007 | User submits by send button, Enter or quick prompt | Same API submission path receives current UUID, entered message and current context; valid submission appends one user message, clears input and hides initial prompts; blank/oversized input and IME composition do not submit | Composer/provider tests |
| AC-0012-008 | A request is pending and duplicate submission is attempted | Accessible waiting state appears; only one request is issued; send/prompt/retry controls prevent duplicates | Controlled-promise tests |
| AC-0012-009 | A request completes successfully | Exactly one assistant response appears; full text and ordered stone references are retained; valid empty stones array displays text without links | Response and provider tests |
| AC-0012-010 | A returned stone link is followed | Canonical route helper opens that stone's details through existing navigation; mock references resolve to Mars/Luna; missing API demo references show existing Stone not found without seeding or substitution | Application navigation tests and HTTP/browser smoke |
| AC-0012-011 | HTTP, network or malformed-response failure occurs and Retry is clicked | Prior conversation/user message remain, readable error is announced, no false success/fallback occurs; new turns are blocked until retry succeeds; retry sends the original payload once without duplicating the user message | Transport and controlled-promise retry tests |
| AC-0012-012 | Catalog/details/other routes and Back/Forward are visited | Same UUID, messages, draft and open state survive; widget is visible only on catalog/details and returns with preserved state | Application navigation tests |
| AC-0012-013 | User navigates or collapses while a request is pending | No cancellation/resend occurs; originating context stays in the payload; completion/failure updates the same session once; subsequent new submission uses current page context | Deferred navigation and failure/retry tests |
| AC-0012-014 | Browser fully reloads or another application session starts | New UUID, empty conversation state and collapsed launcher; no chat persistence in browser storage/cookies or on backend | Session lifecycle tests and source review |
| AC-0012-015 | UI runs in ordinary/API or explicit mock mode | API mode uses configured existing transport; mock mode works without backend and returns the same fixed payload; components do not import mocks and API failure does not fall back | Adapter/mode tests and smoke |
| AC-0012-016 | Widget is inspected on desktop/tablet/mobile and alongside existing modal flows | Reference direction, internally scrolling history, usable composer, no horizontal overflow; desktop catalog chat space is released on collapse; four catalog columns and filters remain; chat respects existing modals and reduced motion | Browser inspection and targeted regression tests |
| AC-0012-017 | Keyboard or assistive announcements are exercised | Semantic labelled controls, expanded state, visible focus, nonmodal interaction and concise response/pending/error announcements work; plain-text response content is not interpreted as HTML | Accessibility interaction tests and browser inspection |
| AC-0012-018 | Feature verification finishes | Required module checks, generated-contract checks, focused regressions and API/mock smoke pass; evidence/limitations are recorded; local UI remains running with URL reported; no commits/pushes without explicit authorization | Recorded verification and final diff review |

## Evidence Policy

Use controlled promises for pending, route-switch, duplicate-send and retry
tests. Keep test data/state isolated. Verify behavior rather than framework
internals. Record automated, actual HTTP and browser-rendering results separately;
do not claim browser checks from jsdom or successful HTTP entry responses.

Use the mock dataset for demo-link checks. Do not populate the user's database.
A real API smoke check can exercise the stub without creating resources.
Record unperformed or unavailable checks honestly. Do not alter earlier feature
criteria or weaken tests to fit an undocumented implementation.

## Verification Status

T0012-001 through T0012-006 are complete. Runtime verification was restricted
to chatbot functionality and its integration boundaries as explicitly requested.

## Delivery Evidence — 2026-10-09

Pinned runtimes: JDK 23.0.2, Node 24.21.0 and npm 11.19.0.

Backend command, from stone-shelter-api:

```sh
JAVA_HOME=/usr/local/Cellar/openjdk/23.0.2/libexec/openjdk.jdk/Contents/Home ./mvnw -q -Dtest=StoneChatbotControllerTest,StoneChatbotArchitectureTest,StoneChatbotTransportTest -Dchatbot.transport=true verify
```

Result: 20 tests passed, zero failures/errors/skips. Seventeen controller and
generated-contract cases verify fixed responses, invalid/missing inputs, accepted
optional contexts, identifier/message limits, JSON/YAML schemas and equivalent
generated documents. Two architecture checks exercise the scoped stub boundary
and retain the DTO-construction restriction for other controllers. One opt-in
transport test runs the actual frontend adapter and development/preview Vite
proxies against the real Spring HTTP controller, checks 400 validation and
standalone mock mode, then closes temporary servers. The isolated controller
contexts exclude database configuration; no catalog data is written or seeded.
All five new backend source types are present under target/classes.

Frontend command, from stone-shelter-ui:

```sh
npm run test -- --run src/api/chatbotApi.test.ts src/features/stone-chatbot/state/ChatSessionProvider/ChatSessionProvider.test.tsx src/features/stone-chatbot/components/StoneChatbot/StoneChatbot.test.tsx src/features/stone-chatbot/components/StoneChatbot/StoneChatbotNavigation.test.tsx
```

Result: 30 tests in four files passed. They cover transport/mode selection,
malformed responses, UUID/state lifecycle, synchronous duplicate guards,
navigation/collapse while pending, original-context retry, input/IME handling,
plain text, ordered links, Back/Forward, hidden routes, modal priority and
missing demo references. No unrelated test suites were run.

`npm run lint`, `npm run build` and `npm run build:mock` passed. The final dist
was restored to API mode and contains no mock adapter/data chunks. Git diff
whitespace and source-root checks passed. Root/UI READMEs document focused
commands and the stub lifecycle. Existing feature documents and user notes were
preserved; no dependencies, migrations, commits or pushes were introduced.

| Criteria | Evidence and status |
| --- | --- |
| AC-0012-001–AC-0012-004 | Passed: controller/validation/generated JSON+YAML/architecture checks and source review |
| AC-0012-005–AC-0012-009 | Passed automated interaction/lifecycle checks; visual comparison remains unperformed |
| AC-0012-010–AC-0012-014 | Passed: mock-link navigation, missing reference, pending/hidden route, retry, Back/Forward and fresh-provider lifecycle checks; reload reset also follows absence of browser/server persistence |
| AC-0012-015 | Passed: API/mock adapter tests, actual Spring-to-Vite transport smoke and both builds |
| AC-0012-016 | Partial: resize-state/modal-priority checks and responsive/reduced-motion CSS review passed; viewport rendering, overflow and bitmap comparison require an available browser |
| AC-0012-017 | Passed automated focus/labels/Escape/plain-text checks and semantic live-region review; actual screen-reader/browser interaction is unverified |
| AC-0012-018 | Focused checks, builds, HTTP smoke and evidence/diff checks passed; browser limitations recorded |

## Local Preview and Browser Limitation

The mock UI development server remains running at
`http://127.0.0.1:5175/stone-shelter/catalog`; an actual HTTP entry check returned
200 after verification. The mock catalog resolves the stub's Mars (1) and Luna
(3) links. API-mode real catalogs may lack those demo references and retain the
ordinary not-found behavior.

Computer-use inventory returned no available browsers; attempts to open both
`iab` and `chrome` reported Browser is not available. No screenshot, responsive
pixel/overflow inspection or actual assistive-technology behavior is claimed.
HTTP and jsdom results are not substitutes for that visual verification.
