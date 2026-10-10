# Feature 0016: Acceptance Criteria

Status: Implementation, focused tests and actual HTTP/proxy verification completed.
Actual browser verification remains blocked; T0016-006 stays open. Accepted D-001–D-011 are in [spec.md](spec.md) and
[ADR-0008](../../docs/adr/0008-chat-memory-and-request-protection.md).
Bucket4j 8.21.0 and Resilience4j 2.4.0 passed qualification; actual LLM N and
numeric budget amounts remain deferred to model integration. T0016-001 finalizes implementation
allowlists/selectors without reopening the accepted policies.

| ID | Given / When | Expected result | Verification |
| --- | --- | --- | --- |
| AC-0016-001 | A valid new turn is sent and its fixed answer is completed | Redis atomically stores one chronological user/assistant pair with its turnId, exact text, original page context, complete ordered stone references and replay response before HTTP 200; history retrieval returns the pair with matching turn IDs | Focused repository, service and HTTP tests |
| AC-0016-002 | Several turns include different page contexts and ordered stone references | Full history preserves turn order, each user context and each assistant's reference IDs/names/order; it does not substitute current page context or catalog data | Repository round-trip and mapper tests |
| AC-0016-003 | The user navigates between catalog, details and another existing route, uses Back/Forward, or collapses the widget | UUID, visible messages, draft and open state remain; a pending request is neither cancelled nor resent, and its completion updates the same session once | ChatSessionProvider and existing navigation tests |
| AC-0016-004 | The page fully reloads within the retention period | The same browser binding retrieves the saved messages and links once; composer remains blocked while restoring; initial prompts stay hidden for nonempty history; draft/errors are not restored and the widget starts collapsed | Provider lifecycle tests and an actual API-mode browser reload; D-001 |
| AC-0016-005 | A fresh, unknown or expired conversation is restored, or Redis data was lost during restart, with healthy required components and no retained foreign owner | Successful authoritative lookup confirms missing history; HTTP 200 contains the requested UUID and an empty messages array, and the UI can start a new turn without fabricated history; failed lookup is never interpreted as absence | History endpoint/provider tests and isolated restart smoke |
| AC-0016-006 | A new completed pair is committed, then GETs, committed replays, rejected attempts or navigation occur before inactivity expiry | History/deduplication expires 24 hours after the latest newly committed pair; only another newly committed pair refreshes it; reads/replay do not refresh or resurrect data, and owner/session/cookie lifetimes remain aligned | Real Redis integration tests with an isolated shortened test TTL, including read/replay non-refresh and new-turn refresh; D-003 |
| AC-0016-007 | History exceeds 10 complete pairs or 20,000 characters in the deterministic reference/context-inclusive representation | Context retains the latest complete chronological pairs within both limits, discards oldest whole pairs and omits an oversized newest pair without splitting/reordering references; stored/UI history is unchanged | Context-selector pair-count/character boundary and oversized-pair tests; D-002 |
| AC-0016-008 | Another browser presents a retained conversation UUID, or the original browser loses its cookie while ownership is retained | Send, restore and replay return 404 without disclosing existence/content or transferring ownership; UUID/IP are not proof of ownership; a retained owner binding is enforced even with an empty transcript | Two-browser/session and cookie-loss HTTP tests; D-001 |
| AC-0016-009 | A request fails before a completed pair can be persisted | No partial pair is stored and no successful assistant response is returned; the existing local user message, turnId and original payload are preserved without a duplicate entry; manual send retry requires completed recovery if a required dependency failed | Failure-injection repository/service and controlled-promise provider tests |
| AC-0016-010 | Redis or another required storage/control component is unavailable during send or restore | HTTP 503 ProblemDetail uses CHAT_UNAVAILABLE; the UI preserves displayed messages/draft, marks chat unavailable and blocks send/send-retry until readiness-verified history recovery succeeds; no mock, local-memory, cached-response or empty-history fallback | Focused handler, HTTP and provider tests; D-011 |
| AC-0016-011 | A committed response is lost, or the page reloads during a pending send | Within retention, same-turnId/same-payload retry returns the exact committed response without another pair; reload restores authoritative history with pair turn IDs and does not reconstruct/automatically resend uncommitted work; intentional repeated text uses a new ID; expiry/data loss is not treated as proof of rollback | Lost-response, retry-ID and pending-reload tests; D-004 |
| AC-0016-012 | Invalid message requests, missing/malformed turnId or invalid history-path UUID are submitted with an accepted Origin where applicable and an allowing IP gate | HTTP 400 ProblemDetail retains original message/context limits and enforces required UUID turnId; invalid requests neither append history nor refresh history/session TTL; the IP-attempt budget may be charged | StoneChatbotControllerTest boundary cases and history endpoint tests |
| AC-0016-013 | Generated OpenAPI JSON and YAML are inspected | Existing POST, the agreed history route, shared DTOs, constraints, ownership behavior and agreed error statuses match spec.md; documentation describes persisted demo history without claiming model integration; no handwritten OpenAPI is added | Focused generated-contract tests after T0016-001 |
| AC-0016-014 | Explicit mock mode sends messages and reloads the page | The same restore/submission interface preserves mock history for the selected browser scope; mocking remains at the API boundary and API failures never activate mocks | Adapter/mode and provider tests plus mock-mode reload smoke; D-001/D-003/D-004 |
| AC-0016-015 | Backend architecture and feature diff are reviewed | Controllers delegate original request DTOs, services obtain ready responses through mappers, repositories own Redis operations, and normal controller construction restrictions include StoneChatbotController; no model/search/Kafka/database work or dependencies beyond the explicitly qualified Bucket4j and conversation-bulkhead Resilience4j artifacts appear | Scoped ArchUnit tests and diff review |
| AC-0016-016 | Anonymous sessions are created/restored and later expire | Redis holds a server-issued identity and exclusive conversation-owner binding independent of transcripts/quotas; cookie is opaque/random, HttpOnly, SameSite=Lax, host-only and Secure under HTTPS; sessionStorage UUID survives tab reload; session/cookie retention aligns with owned histories and IP grants no history access | Real Redis session-store, cookie/header and two-session HTTP tests; D-001 |
| AC-0016-017 | A session/IP exhausts a send or history bucket, then refill time passes | Default capacities/refills match the accepted spec table; continuous token-bucket burst/refill is configurable and is not reported as a strict rolling-minute count; separate restore quota still works after send exhaustion; rejection creates no messages or retention activity | Bucket4j/Redis boundary tests and send/history HTTP tests; D-005 |
| AC-0016-018 | Multiple limiter clients concurrently use the same bucket key, or a caller changes conversation UUID/cookie | Redis-backed consumption does not exceed bucket capacity; new conversation UUIDs retain the same session quota, and new cookies do not reset the existing IP budget; IP gating precedes session allocation | Concurrent real-Redis tests and multi-session HTTP cases; D-001/D-005 |
| AC-0016-019 | Rate buckets become idle, history is read, or Redis becomes unavailable | Bucket expiry follows full token recovery plus 60-second grace and never restores capacity early; history/session activity does not reset quotas; unavailable state returns 503 without bypass; previously consumed tokens are not refunded after a later rejection/failure | Expiry, charging and failure-injection tests; D-005/D-006 |
| AC-0016-020 | Requests arrive directly, through configured frontend proxies, or with spoofed forwarding headers | Explicit proxy allowlist and ingress header removal/overwrite produce the canonical IPv4/IPv6 client identity; direct requests use the peer despite supplied headers; Docker and host Vite paths are verified without treating a proxy address as a proven browser address | Targeted client-address tests and actual proxy smoke; D-008 |
| AC-0016-021 | Concurrent requests target the same authorized conversationId or different conversations in one session while a turn is held pending and required components are healthy | A reused conversation-scoped SemaphoreBulkhead with maxConcurrentCalls=1 admits at most one active turn and returns 429 for a second; different conversation IDs have independent permits and may proceed when request quotas permit; serialization covers context read through pair persistence; history retrieval remains available without a processing permit | Controlled concurrent service/HTTP tests with distinct conversations and sufficient quotas; D-007 |
| AC-0016-022 | Conversation processing completes, reaches its deadline, loses its client or fails renewal/ownership checks | Initial deadline is 120 seconds, lease 150 seconds and owner-checked renewal every 30 seconds; permit remains held until actual exit, stale work cannot commit/delete a newer lease, ownership loss closes chat, and active/racing registry entries are never evicted/recreated; overlap is prevented in the single-backend scope | Controlled deadline/renewal/registry and owned-release/commit tests plus isolated short-lease Redis expiry; D-007 |
| AC-0016-023 | The widget receives quota/conversation-busy rejection and the user retries | ProblemDetail code and Retry-After match the agreed contract; manual retry observes the cooldown, preserves the original payload and one user entry, and never automatically resends; restore/send states remain separate; committed replay consumes request quotas without a new processing turn | Handler/generated-contract, adapter and controlled-clock provider tests; D-004/D-005 |
| AC-0016-024 | Bucket4j integration is qualified | The selected explicitly pinned artifacts compile and perform real-Redis consumption/expiry using the project's JDK and managed Lettuce client, without a second Redis client or an implicit version downgrade; unsuccessful qualification is recorded rather than claimed compatible | Focused dependency qualification and Bucket4j Redis integration test; D-006 |
| AC-0016-025 | The model-concurrency handoff is reviewed | Conversation maxConcurrentCalls=1 is distinct from future per-instance LLM N selected by model/hardware load measurements with zero wait; fixed demo/history consumes no LLM permits; actual provider/cancellation/enforcement checks belong to the model feature | Documentation review and linked future requirements; D-009, no runtime LLM-concurrency claim in 0016 |
| AC-0016-026 | The overall-budget handoff is reviewed | A future shared daily token budget and paid-provider daily cost budget reserve before invocation, settle actual usage and retain unknown-usage reservations in reliable accounting independent of transcript TTL; amounts/reset boundary/ledger are deferred; rate/concurrency checks are not proof of budget enforcement | Documentation review; D-010, no billing/budget implementation claim in 0016 |
| AC-0016-027 | Each required component is separately uninitialized, times out, throws, returns unreadable state or leaves a control result unknown | Send/history/selected committed replay fail closed with 503; a detected failure invalidates readiness for other conversations too, and otherwise healthy paths cannot bypass it; no fixed/model processing follows failed admission and no quota is fabricated/reset | Focused availability-service and HTTP failure matrix for session, transcript/context, limiter and serialization components; D-011 |
| AC-0016-028 | A required dependency fails during an admitted turn, including loss of the completed-write acknowledgement | No unconfirmed assistant success or partial pair is exposed; cancellation/cleanup preserve actual permit lifetime and ownership checks; an unknown commit remains explicitly uncertain until authoritative reconciliation under D-004, without automatic resend or an assumed rollback | Controlled in-flight service/Redis acknowledgement-failure and provider tests; D-004/D-007/D-011 |
| AC-0016-029 | Chat starts unavailable, or manual recovery is requested during/after an outage | One controlled startup/recovery verification attempt exercises actual required components on isolated service-only keys without user quota/message effects; concurrent probes are not queued/run in parallel; initial logical Redis timeout is 1 second; failed/partial checks keep chat closed, while complete verification and history reconciliation enable sends; ordinary quota/busy rejection remains separate | Startup/recovery, timeout and controlled provider tests plus isolated recovery smoke; D-011 |
| AC-0016-030 | A retained committed turnId is replayed with identical or changed message/context | Same authorized identity/payload returns the exact response without another turn or TTL refresh; changed payload returns 409 CHAT_TURN_CONFLICT; replay consumes request quotas; intentional repeated text with a new ID is a new turn; deduplication expires with history | Atomic repository and service/HTTP identity-conflict, retention and replay tests; D-004/D-005 |
| AC-0016-031 | POST supplies an allowed, missing, null or foreign Origin while components are healthy | Allowed configured frontend origin proceeds through normal admission; missing/null/foreign origin returns 403 CHAT_ORIGIN_REJECTED without processing/history activity; untrusted forwarded headers cannot make an origin trusted | Focused origin-boundary and HTTP tests; D-001/D-008 |
| AC-0016-032 | Resilience4j integration is qualified and deployment scope reviewed | Candidate 2.4.0 minimal programmatic bulkhead compiles/works with the project stack; one active turn is verified within one backend process; no multi-backend or surviving-provider guarantee is claimed from a lease or local permit | Focused qualification/serialization tests and scoped dependency/documentation review; D-007/D-009 |
| AC-0016-033 | A required chat component fails while independent application routes remain usable | Shared chat readiness closes send/history/replay across conversations, and manual recovery cannot reopen it with an old/failed verification result; catalog/navigation availability and application liveness are not coupled to this chat-only failure state | Availability-service/HTTP and controlled provider checks; D-011 |

## Verification Policy

Run only the test classes/files explicitly included in the requested task.
Do not run the full backend or frontend suite. Real Redis tests use isolated
keys and clean up their own data; never flush the shared Redis database.
Use a short test-only TTL to verify inactivity expiration without waiting
24 hours; preserve the production default. UI async tests use controlled
promises for restoration, navigation, failures and lost-response cases.
Use controlled pending work for concurrency tests and a test clock where
supported for quota/UI cooldown checks; verify actual Redis atomicity and
cleanup separately. Conversation-serialization tests do not prove LLM bulkhead
behavior, provider cancellation, deployment-wide concurrency or cost control.
Model-invocation and budget runtime checks belong to their future feature.
The current failure matrix covers required components actually introduced in
0016, including component failures with Redis itself still reachable. Later
model/budget features must extend that matrix when their controls become required;
no absent future component is treated as a current startup dependency.

Record automated and actual browser/HTTP smoke results separately. Do not claim
reload restoration from navigation tests, Redis persistence from in-memory
fakes, or model use from a context-selector test. Record unavailable checks
honestly. Documentation preparation does not satisfy runtime criteria.

## Execution evidence

- T0016-001: finalized exact file allowlists/selectors and technical details;
  accepted policies and deferred model boundaries remain unchanged. Runtime
  verification has not yet been performed.

- T0016-003: StoneChatContextSelectorTest passed (2 tests): latest whole-pair
  limits, exact 20,000-character boundary including references/context, oversized
  newest pair and immutable complete history.
- T0016-010: reviewed model concurrency/budget handoff; future N, amounts, daily
  reset, provider lifetime/cancellation and reliable ledger remain explicitly
  deferred (AC-0016-025/026). No runtime enforcement claim.
- T0016-005: all four named frontend files passed, 34 tests; lint and production
  build passed on official SHA-256-verified Node 24.21.0 / bundled npm 11.19.0.
  Tests cover hydration/reload IDs, pending reload, manual recovery, lost-ack
  reconciliation, quota cooldown, exact retry payload, mocks and navigation.
  This is automated lifecycle evidence; actual browser reload remains T0016-006.

- T0016-007: JDK 23.0.2, Bucket4j 8.21.0 and managed Lettuce compiled;
  three real-Redis limiter tests passed. Docker socket access required a sandbox
  escalation; the permitted retry passed. No fallback store was used.
- T0016-008: three named session/address/origin tests passed. Actual host/Docker
  proxy smoke remains pending; this task is not yet marked complete.
- T0016-009: two serialization tests and one real-Redis lease test passed;
  Resilience4j 2.4.0 is qualified for the single-backend conversation guard.
- T0016-002: four real-Redis repository tests passed: atomic pairs, exact payload,
  replay/conflict, write-only TTL refresh, stale lease/deadline rejection,
  authoritative expiry, unreadable-state closure and isolated probe cleanup.

- T0016-011: all three availability tests passed, covering each required probe
  failure, ordinary quota rejection, zero-wait concurrent recovery and fault
  generation protection.
- T0016-004: all 48 checks in the six named classes passed. The service test
  initially failed while replacing an exception-throwing Mockito stub; switching
  that setup to doAnswer preserved the assertions and the isolated rerun passed.
  The other five classes were not rerun after their unchanged successful checks.
- T0016-005 follow-up: separate history Retry-After cooldown was missing. Added
  a manual-only restore cooldown, separate from send cooldown, and its regression
  test. All four named files now pass 35 tests; lint and build passed on
  Node 24.21.0 / npm 11.19.0.
- T0016-008 actual proxy smoke: host Vite on 5175 and Docker Vite on 5174 used
  the current vite.config.js against a temporary echo upstream. Both removed
  Forwarded/X-Forwarded-Host/X-Forwarded-Proto, replaced a spoofed
  X-Forwarded-For with the connection peer (127.0.0.1 and 172.17.0.1 respectively),
  and preserved Origin. Docker NAT peer is not claimed to be a public browser IP;
  deployment must configure only its actual trusted ingress peer. Direct
  untrusted-peer spoofing rejection is covered by StoneChatClientAddressTest.
- T0016-006 actual HTTP smoke: one backend on JDK 23.0.2 used isolated
  PostgreSQL/Redis containers and the host Vite API proxy. Confirmed a completed
  chronological pair with original context, ordered links and matching IDs;
  exact replay, changed-payload 409, session quota 429/Retry-After, independent
  history quota, HttpOnly/SameSite/path cookie attributes, foreign-session
  send/restore 404 and missing-Origin 403. No real catalog demo records were seeded.
- T0016-006 failure/recovery smoke: paused only the isolated Redis container.
  Send and history returned CHAT_UNAVAILABLE 503 while application health and
  catalog page remained available. After unpause, send remained 503 until a
  manual history GET verified components and reconciled the saved pair; replay
  then returned the exact answer. Expiring only that test history key returned
  authoritative empty history. No shared Redis flush or model call was used.
- T0016-006 generated-contract smoke: live JSON/YAML include both routes,
  required request turnId, five-field history messages, unchanged two-field send
  response, documented 400/403/404/409/429/503 and Retry-After. Generated artifacts
  were inspected in temporary storage; no handwritten contract was added.
- T0016-006 limitation: browser inventory was empty; both Chrome and in-app
  browser creation returned Browser is not available. Actual API-mode reload,
  restored-link interaction, widget outage/recovery and explicit mock-mode reload
  therefore remain unverified. Passing provider lifecycle tests and HTTP smoke
  do not substitute for these browser checks; T0016-006 remains unchecked.

- Additional failure evidence: StoneChatConversationRepositoryTest now passes
  five tests, including an actual Redis commit followed by an injected lost
  acknowledgement; authoritative retrieval/replay finds exactly one pair.
  StoneChatConversationSerializationServiceTest now passes three tests,
  including failed renewal stopping progression while retaining the live permit.
  Only these two changed selectors were rerun (eight tests passed).
- Review environment: API Vite remains available at http://127.0.0.1:5173 with
  one backend at http://127.0.0.1:8080 and isolated smoke PostgreSQL/Redis on
  15432/16379. These contain only disposable smoke data, not the user's catalog.
  Temporary echo/proxy smoke services were removed after verification.
