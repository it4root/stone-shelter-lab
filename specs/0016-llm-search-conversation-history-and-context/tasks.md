# Feature 0016: Tasks

Requirements live in [spec.md](spec.md), technical decisions in [plan.md](plan.md)
and acceptance criteria exclusively in [acceptance.md](acceptance.md).
Discussion history lives in
[ADR-0008](../../docs/adr/0008-chat-memory-and-request-protection.md).

Status: Policies D-001–D-011 implemented and dependencies qualified; final
browser smoke remains blocked by unavailable browser tooling. The user authorized continuous execution of all remaining tasks on 2026-10-10.
Execute in dependency order and verify each task before continuing.
No commits or pushes are authorized. If a commit is later requested, its
message starts with `0016-llm-search-conversation-history-and-context:` and
includes the full task ID; one commit covers one task.

## Preparation

- [x] **T0016-001 — Finalize implementation tickets for accepted policies.**
  Preserve accepted D-001–D-011 and finalize technical representation/configuration
  details: cookie name/path and allowed origins/proxies, Redis schema/operations,
  deterministic character counting, safe registry retirement and probe cleanup.
  Keep future model N/budget amounts deferred and candidates unqualified until
  checked. Update only this feature's spec.md, acceptance.md, plan.md and tasks.md;
  finalize exact permitted file paths and exact test class/file selectors for every following
  task. Review document links, IDs and requirement/acceptance consistency.
  Product policy is accepted; this gate remains open until the implementation
  allowlists, technical details and selectors are concrete.

## Backend

- [x] **T0016-002 — Implement Redis history storage.** Add the agreed stored
  value types and repository with isolated conversation keys, serialization,
  chronological retrieval and atomic owner-checked completed-turn append with
  required turnId/original response. Same-ID/same-payload replay returns the
  stored result; changed payload conflicts. Only a newly committed pair refreshes
  history/deduplication/owner/session retention; GET/replay do not extend TTL.
  Use existing dependencies. Planned
  focused test: `StoneChatConversationRepositoryTest` using real Redis and
  isolated short-lived keys. Final file allowlist is required from T0016-001.
  Depends on T0016-001, T0016-008 and T0016-009 for lease ownership guards.
  Coverage: AC-0016-001, AC-0016-002, AC-0016-006, AC-0016-009, AC-0016-030
  and storage portions of AC-0016-008/AC-0016-011/AC-0016-022.

- [x] **T0016-003 — Implement bounded context selection.** Add the pure selector
  over completed stored turns with 10-pair/20,000-character limits and
  deterministic reference/page-context representation. Keep model integration outside this task.
  Planned focused test: `StoneChatContextSelectorTest`. Final file allowlist is
  required from T0016-001. Depends on T0016-002. Coverage: AC-0016-007.

- [x] **T0016-004 — Integrate service, mappers and history HTTP API.** Introduce
  the normal application/mapping path for the fixed answer and stored history,
  required turnId validation, the accepted session/ownership boundary, five-field
  class-based history-entry DTOs with turnId, history route and dependency-error
  translation. Update generated documentation annotations and restore ordinary
  controller architecture restrictions. Apply the qualified admission guards
  and shared fail-closed readiness, plus the 403/404/409/429/503 contract and
  applicable Retry-After headers. Preserve the two-field send response.
  Planned focused tests:
  `StoneChatbotServiceTest`, `StoneChatHistoryMapperTest`,
  `StoneChatbotControllerTest`, `StoneChatHistoryControllerTest`,
  `StoneChatbotArchitectureTest` and the affected rules in `ArchitectureTest`.
  T0016-001 must replace this proposed list with exact selectors and paths.
  Depends on T0016-002, T0016-007, T0016-008, T0016-009 and T0016-011. Coverage:
  AC-0016-001, AC-0016-002, AC-0016-005, AC-0016-008–AC-0016-013,
  AC-0016-015–AC-0016-023, AC-0016-027–AC-0016-031 and AC-0016-033 at the
  HTTP/application boundaries, including history/replay closure despite a working transcript read.

- [x] **T0016-007 — Qualify and implement Redis rate limits with Bucket4j.**
  Qualify candidate 8.21.0 against the existing JDK/managed Lettuce client, pin
  the agreed artifacts and stack ADR, and implement the selected send/history
  session/IP buckets with the accepted default burst/refill table, replay charging,
  no refunds of consumed tokens, full-refill-plus-60-second expiry and fail-closed
  storage behavior. Bound the whole logical Redis operation, including CAS
  retries, by the initial 1-second timeout.
  Dependency/property files are in scope only when explicitly listed by
  T0016-001; do not add a second Redis client. Planned focused test:
  `StoneChatRateLimiterRepositoryTest` with real Redis and concurrent limiter
  clients. Depends on T0016-001. Coverage: AC-0016-017–AC-0016-019,
  AC-0016-024 and limiter portions of AC-0016-023/AC-0016-029/AC-0016-030.
  This ID does not renumber the earlier tasks.

- [x] **T0016-008 — Implement Redis anonymous sessions and trusted client binding.**
  Add the agreed server-issued cookie/session record lifecycle and conversation
  exclusive ownership lookup; enforce foreign UUID 404 without cookie-loss
  transfer, cookie attributes and write-only aligned retention. Add POST Origin
  allowlist validation with missing/null/foreign rejection and no trust in spoofed
  headers. Verify client-IP identity through both existing frontend
  proxies; only edit explicitly listed binding/proxy/property files. Apply the
  existing IP gate before session allocation. Planned focused tests:
  `StoneChatSessionRepositoryTest`, `StoneChatClientAddressTest` and
  `StoneChatOriginValidationTest` plus the
  agreed proxy smoke selector. Depends on T0016-001 and T0016-007. Coverage:
  AC-0016-008, AC-0016-016, AC-0016-018, AC-0016-020 and AC-0016-031. Final paths/selectors
  are required from T0016-001.

- [x] **T0016-009 — Implement conversation serialization.** Add the agreed
  reused Resilience4j SemaphoreBulkhead per authorized conversationId with
  maxConcurrentCalls=1/maxWaitDuration=0 and the owned Redis lease, immediate
  conversation-busy rejection, full-turn permit lifetime, 120-second deadline,
  150-second lease, 30-second owner-checked renewal and safe loss/registry cleanup.
  Deliver one backend process; do not claim multi-process exclusion from expiry.
  Qualify candidate 2.4.0 and pin minimal programmatic resilience4j-bulkhead
  using the exact dependency/ADR allowlist finalized in
  T0016-001. Other conversations in the same session must not share its permit.
  No per-instance LLM bulkhead wiring, queue or model calls belong to this
  task. Planned focused tests: `StoneChatConversationSerializationServiceTest` and
  `StoneChatActiveTurnRepositoryTest`, with controlled pending work and isolated
  real-Redis lease keys. Depends on T0016-007 and T0016-008. Coverage:
  AC-0016-021, AC-0016-022, AC-0016-032 and concurrency portions of AC-0016-023.
  Final paths/selectors are required from T0016-001.

- [x] **T0016-011 — Implement shared fail-closed chat availability.** Implement
  the approved D-011 readiness/failure/recovery policy across required session,
  transcript/context, limiter and serialization components. Reject unknown or
  failed component results, invalidate shared readiness across conversations,
  preserve ordinary quota/busy rejections and verify all required checks before
  recovery. Enforce initial logical Redis timeout of 1 second, one controlled
  startup/manual recovery attempt, actual-component probes on isolated service
  keys without user quota effects, and protection against stale recovery success.
  Keep other routes/liveness independent. Cover admitted-work failure and unknown
  write outcomes under D-004,
  with real permit lifetime and owner-checked cleanup. No fallback, reset of
  unknown counters, new health endpoint, automatic resend or future model/budget
  implementation. Planned focused test: `StoneChatAvailabilityServiceTest`;
  T0016-004 covers HTTP translation and T0016-005 covers browser recovery.
  Depends on T0016-002, T0016-007, T0016-008 and T0016-009. Coverage:
  application portions of AC-0016-010, AC-0016-027–AC-0016-029 and AC-0016-033.
  Final file paths/selectors are required from T0016-001.

- [x] **T0016-010 — Record the selected LLM-concurrency and budget handoff.**
  Review/hand off accepted requirements for Resilience4j SemaphoreBulkhead per
  application instance with maxConcurrentCalls=N selected by future model/hardware
  load measurements,
  keeping conversation maxConcurrentCalls=1 separate, and for token/cost
  accounting. Identify future requirements for actual-call permit lifetime,
  shared daily token/paid-provider cost budgets, conservative reservation/actual
  settlement, retained unknown usage and reliable ledger storage. Amounts, reset
  boundary and storage/provider contract are future-model decisions before runtime
  tasks are executed; require their controls to join shared fail-closed readiness
  when activated. Modify only this feature's four specification documents;
  verify links, IDs and scope consistency, without adding dependencies, model
  adapters, a budget ledger or runtime tests. Depends on T0016-001. Coverage:
  AC-0016-025 and AC-0016-026. Runtime delivery belongs to the separately
  specified model feature, not this documentation task.

## Frontend

- [x] **T0016-005 — Restore browser conversations in API and mock modes.** Add
  the agreed history DTOs/adapter, browser binding, provider hydration state,
  restore-error retry and mock history persistence. Extend the existing widget
  only where restoration or chat unavailability needs visible feedback.
  Preserve normal navigation and send/retry behavior; add manual Retry-After cooldown and the
  accepted ownership/origin/conflict/rate/busy error handling. Generate turnId
  per intentional send, reuse original ID/payload for manual retry and reconcile
  pair IDs from restored history. Full reload restores committed history only,
  without reconstructing/automatically repeating pending sends. Explicit mocks
  implement matching pair IDs, replay/conflicts and write-only retention.
  Planned focused test files:
  `chatbotApi.test.ts`, `ChatSessionProvider.test.tsx`, `StoneChatbot.test.tsx`
  and `StoneChatbotNavigation.test.tsx`, under their existing directories.
  Final file paths/selectors are required from T0016-001. Depends on T0016-004.
  Add the shared unavailable state, blocked send/send-retry and manual
  readiness-verified history reconciliation, preserving the transcript/draft
  without automatic resend or mock fallback. Coverage: AC-0016-003–AC-0016-005,
  AC-0016-009–AC-0016-011, AC-0016-014 and UI portions of AC-0016-023,
  AC-0016-028–AC-0016-030 and navigation portions of AC-0016-033.

## Feature Verification

- [ ] **T0016-006 — Verify agreed runtime flows and record evidence.** Run only
  the agreed focused integration selectors that have not already passed with
  unchanged relevant inputs. Smoke an actual API-mode reload, retained stone
  links, isolated expiry/data-loss behavior, agreed session isolation and retry
  behavior, then explicit mock-mode reload. Exercise agreed rate/concurrency
  and trusted IP behavior without rerunning unchanged successful checks. Review
  component-failure, in-flight uncertainty and recovery evidence; smoke the
  agreed unavailable/recovery flow. Review generated JSON/YAML contracts,
  including required turnId, pair IDs and origin/owner/conflict/quota/busy/unavailable
  responses, and the scoped
  feature diff; record evidence/limitations in acceptance.md and
  mark completed task checkboxes here. No full suite, shared Redis flush, model
  calls or unrelated stack changes. Exact test selectors and permitted evidence
  file paths must be finalized in T0016-001. Depends on T0016-003,
  T0016-004, T0016-005 and T0016-007–T0016-011. Coverage:
  AC-0016-001–AC-0016-033; AC-0016-025/AC-0016-026 are documentation-only
  handoff checks in this feature.

Task IDs are stable, not execution order. The dependency order is T0016-001,
T0016-007, T0016-008, T0016-009, then T0016-002; T0016-003 follows storage,
T0016-011 follows storage/admission and T0016-004 follows shared readiness,
T0016-005 follows HTTP integration,
T0016-010 records the model-feature handoff after decisions, and T0016-006 is
final verification. Continuous execution of this order is authorized by the user.

## Exact implementation boundaries (T0016-001)

The following are exhaustive per-task write allowlists. Each task may also update
this feature's four specification documents to record progress and evidence.
No unrelated source or user changes are included. Backend focused selectors use
`./mvnw -Dtest=<named classes> test`; Redis selectors require an isolated
Testcontainers Redis 8.2.10 instance. Frontend selectors use
`npm run test -- --run <named test paths>`; frontend lint/build are included in
T0016-005 verification. T0016-006 uses HTTP/browser smoke only and reruns a
focused selector only after relevant inputs change.

### T0016-007

- `stone-shelter-api/pom.xml`
- `stone-shelter-api/src/main/resources/application.yaml`
- `.env.example`
- `docs/adr/0001-stack-versions.md`
- `docs/adr/0008-chat-memory-and-request-protection.md`
- `stone-shelter-api/src/main/java/lab/stoneshelter/repositories/StoneChatRateLimiterRepository.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/repositories/StoneChatRedisRepository.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/services/StoneChatSettings.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/exceptions/StoneChatUnavailableException.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/exceptions/StoneChatRateLimitedException.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatRateLimiterRepositoryTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatRedisTestSupport.java`

### T0016-008

- `stone-shelter-api/src/main/java/lab/stoneshelter/repositories/StoneChatSessionRepository.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/entities/StoneChatSessionEntity.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/services/StoneChatClientAddressService.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/services/StoneChatOriginService.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/exceptions/StoneChatConversationNotFoundException.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/exceptions/StoneChatOriginRejectedException.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatSessionRepositoryTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatClientAddressTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatOriginValidationTest.java`
- `stone-shelter-ui/vite.config.js`
- `compose.yaml`
- `stone-shelter-api/src/main/resources/application.yaml`
- `.env.example`

### T0016-009

- `stone-shelter-api/pom.xml`
- `docs/adr/0001-stack-versions.md`
- `docs/adr/0008-chat-memory-and-request-protection.md`
- `stone-shelter-api/src/main/java/lab/stoneshelter/repositories/StoneChatActiveTurnRepository.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/services/StoneChatConversationSerializationService.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/exceptions/StoneChatConversationBusyException.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatActiveTurnRepositoryTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatConversationSerializationServiceTest.java`

### T0016-002

- `stone-shelter-api/src/main/java/lab/stoneshelter/entities/StoneChatTurnEntity.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/entities/StoneChatStoneEntity.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/entities/StoneChatContextEntity.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/entities/StoneChatConversationEntity.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/repositories/StoneChatConversationRepository.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/exceptions/StoneChatTurnConflictException.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatConversationRepositoryTest.java`

### T0016-003

- `stone-shelter-api/src/main/java/lab/stoneshelter/services/StoneChatContextSelector.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatContextSelectorTest.java`

### T0016-011

- `stone-shelter-api/src/main/java/lab/stoneshelter/services/StoneChatAvailabilityService.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatAvailabilityServiceTest.java`

### T0016-004

- `stone-shelter-api/src/main/java/lab/stoneshelter/controllers/StoneChatbotController.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/controllers/StoneChatHistoryController.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/controllers/StoneChatBindingInterceptor.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/controllers/StoneChatWebConfiguration.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/services/StoneChatbotService.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/services/StoneChatAdmissionService.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/shared/StoneChatMessageRequest.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/shared/StoneChatHistoryResponse.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/shared/StoneChatHistoryMessage.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/enums/ChatMessageRole.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/mappers/entities/StoneChatMessageRequestToStoneChatTurnEntityMapper.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/mappers/dtos/StoneChatTurnEntityToStoneChatMessageResponseMapper.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/mappers/dtos/StoneChatConversationEntityToStoneChatHistoryResponseMapper.java`
- `stone-shelter-api/src/main/java/lab/stoneshelter/handlers/ApiExceptionHandler.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatbotServiceTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatHistoryMapperTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatbotControllerTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatHistoryControllerTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/StoneChatbotArchitectureTest.java`
- `stone-shelter-api/src/test/java/lab/stoneshelter/ArchitectureTest.java`

### T0016-005

- `stone-shelter-ui/src/api/chatbotApi.ts`
- `stone-shelter-ui/src/api/chatbotApi.test.ts`
- `stone-shelter-ui/src/api/dto/StoneChatMessageRequest.ts`
- `stone-shelter-ui/src/api/dto/StoneChatHistoryResponse.ts`
- `stone-shelter-ui/src/mocks/api/mockChatbotApi.ts`
- `stone-shelter-ui/src/features/stone-chatbot/state/ChatSessionProvider/ChatSessionProvider.tsx`
- `stone-shelter-ui/src/features/stone-chatbot/state/ChatSessionProvider/ChatSessionProvider.test.tsx`
- `stone-shelter-ui/src/features/stone-chatbot/components/StoneChatbot/StoneChatbot.tsx`
- `stone-shelter-ui/src/features/stone-chatbot/components/StoneChatbot/StoneChatbot.css`
- `stone-shelter-ui/src/features/stone-chatbot/components/StoneChatbot/StoneChatbot.test.tsx`
- `stone-shelter-ui/src/features/stone-chatbot/components/StoneChatbot/StoneChatbotNavigation.test.tsx`

### T0016-010

Feature specification documents only.

### T0016-006

Feature specification documents only.

T0016-008 proxy smoke: send controlled forwarding headers through host and
Docker Vite proxies, compare the sanitized peer-derived address, and verify direct
spoofing cannot select another client identity. T0016-004 runs the six named
classes above, including all rules in ArchitectureTest. T0016-005 runs exactly
the four listed test files, lint and build. T0016-006 records generated JSON/YAML
and actual API/mock reload, unavailable/recovery and isolated expiry evidence
in acceptance.md; no handwritten contract or shared Redis flush.
