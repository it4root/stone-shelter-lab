# Feature 0016: LLM Search Conversation History, Context and Request Protection

Status: Implementation and focused verification complete; T0016-006 remains
open for actual API/mock browser reload and widget recovery smoke.
D-001–D-011 record the accepted decisions.
The user authorized continuous implementation of all remaining tickets on 2026-10-10.

## Goal and Sources

Store messages and ordered stone references in Redis for 24 hours after the
last newly completed turn is persisted. Preserve the conversation across page
navigation and restore it
after a full page reload. History may be lost when the local stack restarts.
Select a bounded portion of history for later model integration.
The scope also includes Redis-backed anonymous sessions and session/IP rate
limits, plus conversation serialization. Bucket4j/Redis handles request rate;
Resilience4j SemaphoreBulkhead with maxConcurrentCalls=1 is scoped to each
authorized conversationId. The separate per-instance LLM bulkhead has its own
configurable N selected during future model integration. Bucket4j 8.21.0 and
Resilience4j 2.4.0 are accepted qualification candidates.
LLM token/cost budgeting is a separate responsibility for model integration.
Chat availability is fail-closed across all required state and control components.

Source and shared requirements:
[LLM Search Discovery](../0015-llm-search-discovery/spec.md#1-conversation-history-and-context)
and [ADR-0007](../../docs/adr/0007-llm-search-discovery.md#conversation-history-and-model-context).
Reuse the widget and JSON boundary from
[feature 0012](../0012-stone-chatbot/spec.md) and the Redis infrastructure from
[feature 0014](../0014-llm-search-infrastructure/spec.md#redis-and-memory-configuration).

Acceptance criteria live exclusively in [acceptance.md](acceptance.md).
Technical decisions and execution order live in [plan.md](plan.md); work items
live in [tasks.md](tasks.md).
The discussion and decision history is recorded in
[ADR-0008](../../docs/adr/0008-chat-memory-and-request-protection.md).

## Confirmed Requirements

- Redis is the server source of conversation history. Store user and assistant
  messages chronologically, including assistant text and the complete ordered
  `id`/`name` references returned with each answer.
- Preserve the existing request's page context with its user message. A later
  navigation must not replace the context captured when that message was sent.
- Retain the complete stored history for the UI independently of the smaller
  context window selected for future model calls. Keep reference order so a
  future follow-up such as "the second stone" can identify the original result.
- Apply an inactivity TTL of 24 hours, using the existing `CHAT_MEMORY_TTL`
  setting, refreshed only by persistence of a newly completed turn. GET and
  committed replay do not refresh it. History expiration is separate from
  model-context selection.
- Navigation, Back/Forward, widget collapse and temporary widget invisibility
  preserve the current conversation and existing in-flight request behavior.
- A full page reload recovers the browser's conversation binding and loads
  stored messages and references from the backend.
- Missing or expired Redis history, including history lost after a stack
  restart, is a normal empty-history case only after successful authoritative
  operations with healthy required dependencies. An unavailable store is never
  evidence that history is empty. Do not restore fabricated data.
- Continue returning the existing fixed demo answer. This feature supplies
  storage and context selection; model invocation belongs to later features.
- Store anonymous session bindings and request-rate state in Redis alongside
  conversation history, with independent key spaces and expiration policies.
- Enforce server-side request-rate limits and serialize each authorized
  conversation; disabling UI controls alone is insufficient. In the current
  anonymous scope, the server session represents the user for rate limits.
  Conversation serialization is keyed by conversationId, not the session quota.
- Deliver this feature with one backend process. Multiple active backend
  processes require a separately specified execution/ownership protocol; lease
  expiration alone does not establish that another worker has stopped.
- Apply full fail-closed behavior to chat when a required storage, identity,
  rate-limit or serialization component is unavailable or its result is unknown.
  Block every chat operation until required components recover; never bypass
  a guard, replace an unavailable transcript with empty history or use a fallback.

## Agreed Separation of Responsibilities

| Constraint | Mechanism | Scope |
| --- | --- | --- |
| At most the selected request rate per user | Bucket4j with Redis | Anonymous session with an additional broader IP gate |
| At most one active turn per conversationId | Conversation-scoped SemaphoreBulkhead with maxConcurrentCalls=1, plus the owned Redis lease | The authorized conversation, including context reads and completed-turn append |
| At most N simultaneous LLM invocations per application instance | Resilience4j SemaphoreBulkhead | One shared LLM bulkhead across providers/models in each application instance |
| Stay within the overall LLM budget | Separate token and cost accounting | An independently defined shared budget, integrated when real model calls are introduced |

The mechanisms and initial settings below are accepted. Library compatibility
requires qualification; actual LLM N and budget amounts belong to the future
model feature. A rate-limit token measures a request, not an LLM token or
monetary cost. A local bulkhead does not establish
a deployment-wide LLM cap or budget.

## Confirmed Full Fail-Closed Policy

The policy covers Redis connectivity and authoritative operations; session and
ownership state; transcript/context reads and completed-turn writes; Bucket4j
session/IP rate enforcement; and conversation bulkhead/lease enforcement.
An uninitialized component, timeout, failed operation, unreadable state or
indeterminate control result counts as unavailable whenever safe authorization,
accounting, serialization or persistence cannot be established. A Redis ping
alone does not establish that these components work.

While any required component is known unavailable, all conversations are closed
to server chat operations: send, history restoration/retrieval and committed
response replay return HTTP 503 ProblemDetail. An operation that discovers a
dependency failure must fail closed and invalidate chat readiness; subsequent
operations must not proceed through otherwise healthy components. Every logical
Redis operation has an initial configurable 1-second timeout, including any
internal CAS retry budget; tune it only from measurements with an updated
configuration contract. The policy is scoped to the one-backend delivery.

- Do not run fixed-answer or model processing after failed admission. Do not
  use local server memory, cached transcripts, mocks, another identity, freshly
  reset counters or an unchecked default to continue API-mode chat.
- Do not return HTTP 200 for an answer whose complete pair was not confirmed
  persisted. Persist complete pairs atomically; never store a partial pair.
  A lost Redis acknowledgement can leave a commit outcome unknown. Preserve
  that uncertainty and reconcile authoritative state after recovery using
  D-004; do not assume rollback or blindly append a second turn.
- If a failure is detected during admitted work, stop progression and request
  cancellation where supported. Retain local permits until execution actually
  exits, and use owner-checked lease release/commit. Cancellation or best-effort
  cleanup is not proof that work stopped or that a write was rolled back.
- The browser keeps already displayed messages and the draft, shows chat as
  unavailable and disables send/send-retry. It offers a manual recovery action;
  recovery must verify readiness and reconcile history before sending becomes
  available. It must not automatically resend a message or render a server
  outage as an empty conversation. Navigation remains available.
- A healthy limiter reporting exhausted quota or a healthy conversation guard
  reporting occupied capacity is an ordinary rejection, not a component outage.
  Likewise, verified missing/expired data is distinct from unreadable data.
  History reads need no processing permit, but still obey shared readiness.
- When real model invocation is introduced, its required LLM bulkhead and
  token/cost accounting join this policy: unknown capacity or budget state
  closes chat, rather than admitting an unaccounted call. Their absence in the
  current fixed-answer feature is not an outage; unused components are not added.

Recovery requires successful validation of every required component under the
approved policy, not elapsed time alone. Use existing chat operations for manual
recovery; no new health endpoint or automatic retry loop is selected here.
At startup and when a manual history request attempts recovery, run one
controlled component-verification attempt. Concurrent recovery attempts do
not create a probe queue or parallel probes; they remain unavailable while the
attempt runs. Exercise actual Redis read/write/owned-lease operations and the
configured Bucket4j integration on isolated short-lived service-only keys,
and verify local serialization initialization/tracking. Probes must not consume
user quotas, alter conversations, grant ownership or invoke an answer/model.
Only successful checks of every required component followed by successful
authoritative history reconciliation enable browser sends. A failure during
verification or retrieval leaves chat unavailable. Catalog/navigation and other
application routes remain independently available; chat readiness is separate
from whole-application liveness.
Normal approved initialization of genuinely absent ephemeral keys after recovery
is separate from fabricating fresh state while a dependency is unavailable.

## Accepted Session and Request Protection Policy

Use both a primary session limit and a broader IP limit. An anonymous session
is shared across tabs through its cookie; a conversation UUID may remain
tab-specific. Changing the UUID does not create a new session quota. Clearing
the cookie can create a new anonymous session, so apply the IP gate before
allocating sessions. IP is an abuse-control signal, not conversation ownership;
shared networks must not share histories or require an overly strict IP quota.

### Redis Data and Lifetimes

| Data | Key family | Lifetime |
| --- | --- | --- |
| Anonymous session binding | `chat:session:{sessionId}` | Initial 24-hour lifetime; refresh on a newly committed turn, aligned with the cookie and retained owned conversations |
| Conversation ownership | `chat:owner:{conversationId}` | Exclusive server-established owner binding, aligned with retained conversation lifetime; a different session cannot claim a retained UUID |
| Stored conversation and committed-turn identities/results | `chat:history:{sessionId}:{conversationId}` | 24 hours after the latest newly persisted turn, independently for each conversation; deduplication data expires with the transcript |
| Request-rate buckets | `chat:rate:{send-or-history}:{session-or-ip}:{identity}` | Bucket4j expiration after full token recovery plus 60 seconds; independent of history TTL and never earlier than full recovery |
| Active conversation turn | `chat:active:{sessionId}:{conversationId}` | Owned 150-second lease, renewed every 30 seconds for a 120-second processing deadline; release after work finishes |
| Component-verification state | `chat:probe:{probeId}:*` | Isolated short-lived service-only keys, owner-checked cleanup; never user/session quotas or transcripts |
| Per-instance LLM invocation permits | No Redis key | Resilience4j SemaphoreBulkhead while actual model invocation is in progress; runtime wiring belongs to model integration |

The owner prefix isolates authorization domains; it does not make serialization
session-wide. Different conversations owned by one session use different locks
but still consume the same user request-rate quota.

Session records hold the server-established identity and lifecycle metadata,
not copies of transcripts. Resolve and validate an opaque, cryptographically
random server-issued cookie against Redis; do not accept a session owner
supplied in JSON or a caller-selected session secret. Use HttpOnly, SameSite=Lax,
host-only cookie scope and Secure under HTTPS. Store the conversation UUID in
sessionStorage for reload restoration within a tab; it is not an ownership token.

Establish an exclusive server-side conversation owner before admitting its
first new turn. Enforce ownership on send, restore and replay, including an
existing owner binding whose transcript is still empty. Foreign UUIDs return
404 without revealing their existence. Missing/expired cookies may establish a
fresh session after healthy admission, but cannot transfer a retained UUID or
its messages. Existing owner/session bindings remain valid for their retained
histories; a newly committed pair refreshes aligned session/cookie/ownership
lifetimes. Reads, replay, rate checks and rejected attempts do not refresh them.

Validate POST source Origin against the explicitly configured frontend-origin
allowlist as part of CSRF protection. Reject missing, null or untrusted origins
with 403; do not derive a trusted origin from untrusted forwarded headers.
The binding ticket fixes cookie name/path, allowed-origin settings and their
generated-contract annotations before runtime edits.

### Accepted Initial Rate Limits — Configurable

| Operation and identity | Bucket capacity / maximum burst | Continuous refill |
| --- | --- | --- |
| Send, session | 3 tokens | 10 tokens/minute, one token every 6 seconds |
| Send, IP | 10 tokens | 60 tokens/minute, one token every second |
| History read, session | 5 tokens | 30 tokens/minute, one token every 2 seconds |
| History read, IP | 20 tokens | 120 tokens/minute, one token every 0.5 seconds |

One request costs one token. These are token-bucket refill rates with a burst,
not exact fixed/rolling-window quotas. All applicable gates must allow a request.
Send and restore use separate budgets so sending cannot prevent restoration.
The IP budget also covers requests without a valid session, including session
creation attempts; do not create a new session for each rejected request.

Charging order: shared readiness, then IP gate before allocating a session,
binding/validation and the session request quota, then committed-turn replay
and conversation
serialization for a new processing attempt. IP tokens already consumed are not
refunded if a later gate rejects the request; session tokens are not refunded
for a later busy or processing error. A committed
replay consumes the applicable request-rate quotas, but acquires no conversation
processing guard or LLM invocation permit and incurs no new model usage.
Define this conservative policy explicitly rather than promising one atomic
transaction across separate Bucket4j buckets and history writes.

Use the actual remote peer address unless a specifically trusted proxy is
configured. Accept forwarded client addresses only from that trusted proxy,
with canonical IPv4/IPv6 parsing and incoming forwarded headers removed or
overwritten at the trusted ingress boundary. Direct requests use their peer
address even if they supply forwarding headers.
The existing Vite proxy may otherwise make all browser requests appear to come
from one peer; verify that path before claiming per-browser IP protection.

### Conversation Serialization

Allow at most one active turn per authorized conversationId, including requests
from different tabs displaying that conversation. Other conversations in the
same session do not share this serialization lock. Hold it from the history/
context read through processing and atomic completed-turn persistence so two
turns cannot use the same stale context or reorder their answers.

Configure one Resilience4j SemaphoreBulkhead per authorized conversationId with
`maxConcurrentCalls=1` and `maxWaitDuration=0`. Reuse that conversation's
bulkhead across requests; a new bulkhead per request would not enforce the
limit. Other conversations have independent permits and may proceed in parallel.
This value of 1 is not the instance-wide LLM capacity.

Use the bulkhead with an owned Redis conversation lease. Reject a
second active turn immediately rather than maintaining a work queue. History
reads and committed-response replay remain available without taking that lock
only while every required component satisfies the fail-closed readiness policy.
Release the lease only when its random ownership token still matches; never
unconditionally delete another request's lease.

Use a 120-second processing deadline, 150-second lease and owner-checked
renewal every 30 seconds as the accepted initial configurable settings. Expiry
is crash cleanup and must not be mistaken for completion of a live turn. Timeout or
client disconnect must not admit a new same-conversation turn while the old
work continues, nor permit stale work to commit after it loses ownership.
Retain the conversation bulkhead permit until its turn exits, including after
lease loss. Bound inactive bulkhead-registry entries by the conversation lifecycle;
never evict/recreate an entry while its turn is active or racing with admission.
Check lease ownership and valid conversation ownership atomically with completed
pair/idempotency persistence. Renewal failure or ownership loss stops progression,
invalidates chat readiness and prevents the stale worker from committing.
The local bulkhead provides live-turn exclusion in the accepted single-backend
scope; this contract does not certify exclusion across several processes or
future provider calls that survive application failure.

### Per-Instance LLM Concurrency

Use a separate Resilience4j SemaphoreBulkhead around actual LLM invocations,
with independently configured `maxConcurrentCalls=N` and
`maxWaitDuration=0`; select N from model/hardware load measurements in the model
feature, rather than inferring it from conversation serialization. Share that
bulkhead across
conversations and all LLM providers/models in an application instance; do not
create one per request or separate N-permit pools that multiply the instance cap.
Different conversations may proceed concurrently whenever the configured LLM
capacity allows. Pure history operations and the current fixed demo answer do
not invoke the LLM and do not consume LLM permits.

Retain an invocation permit until that invocation actually exits; returning a
timeout or disconnect error must not release capacity while work continues.
Model integration must verify provider timeouts/cancellation before claiming a
strict model-wide bound across disconnects or restarts. With multiple application
instances, each has its own N permits; an overall deployment cap would require
a separate shared mechanism. That mechanism is not selected by this decision.

### Overall LLM Budget — Model-Integration Boundary

Define token usage and cost accounting independently from request rate and
concurrent-call permits. Budget enforcement must account for different prompt/
response sizes and any additional model calls or retries within a user turn.
Use a shared daily token budget, and a daily cost budget when a paid provider
is introduced. Numeric amounts, the daily reset boundary/time zone, units,
provider pricing and ledger implementation belong to the model feature.

Specify reservation before a paid/budgeted call and settlement against actual
usage, with shared atomic accounting. Reserve a conservative input/output
usage/cost bound before invocation; unknown usage retains its reservation until
reconciled and is not blindly refunded after an error. Retrospective reporting
alone cannot enforce a hard budget. Do not
use the ephemeral 24-hour conversation store as an implicitly reliable financial
ledger. D-010 records the handoff to the feature that introduces model calls;
0016 defines this boundary but does not implement billing or model usage.

## Accepted HTTP Requirements

These requirements are accepted for the feature. Finalize task file allowlists,
test selectors and configuration/representation details before implementing
controllers or DTOs. Generated `/v3/api-docs` and
`/v3/api-docs.yaml` remain the only OpenAPI source of truth; do not add a
handwritten OpenAPI document.

### Send a Message

Keep `POST /api/v1/chat/messages`, HTTP 200 and the existing response containing
exactly `text` and ordered `stones`. Preserve the existing request validation:
required UUID `conversationId`, nonblank `message` of at most 2000 characters,
and optional nullable `context.stoneId` in the range 1–9007199254740991.
Add a required UUID `turnId` to the request. Generate it once per intentional
send and reuse it with the identical original message/context for manual retry.
Preserve message text without normalization. Session binding follows D-001.

Committed identity is scoped by authorized session, conversationId and turnId.
For a retained committed turn, the identical message/context returns HTTP 200
with the exact original response and no new processing/pair. A changed message
or context for the same identity returns 409 ProblemDetail. Intentional repeated
text uses a new turnId. Persist the pair, turn identity and exact response
atomically, with the same retention. Concurrent in-progress retry remains
subject to conversation-busy rejection. Retention expiry/data loss ends the
deduplication guarantee; never infer a committed outcome from repeated text.

Replace the controller-only stub with service orchestration and response
mappers. Keep the fixed answer and demo references from feature 0012; do not
validate or seed those demo references in the real catalog.

Append the completed user/assistant pair, including
the original page context and returned references, atomically before returning
200. An unsuccessful append must leave no partial pair. The greeting, draft,
pending indicator and UI error messages are not stored conversation messages.

### Retrieve History

Route: `GET /api/v1/chat/conversations/{conversationId}/messages`.
Return HTTP 200 with `StoneChatHistoryResponse` containing `conversationId`
and a non-null chronological `messages` array. This is full-history retrieval,
not a paginated catalog response.

Each `StoneChatHistoryMessage` contains `role` (`USER` or `ASSISTANT`), `text`,
non-null ordered `stones`, nullable `context` and UUID `turnId`. Both entries
of a completed pair share that turnId, enabling authoritative retry reconciliation.
This five-field nested DTO is a class under the repository's type-size rule.
User entries have empty
`stones` and their submitted context; assistant entries have their returned
references and null context. An unknown or expired conversation returns the
requested UUID and an empty array when no retained foreign ownership exists.
A foreign retained conversation returns 404. GET does not refresh history,
ownership, session/cookie or deduplication TTL and never appends messages.

Malformed UUIDs and invalid send requests return HTTP 400 RFC 9457
ProblemDetail. Required-dependency failures return HTTP 503 ProblemDetail for
both operations and replay under the confirmed full fail-closed policy above.
Exception translation belongs to the handler.

### Rejections and Retry Guidance

Errors, represented by RFC 9457 ProblemDetail and documented in the
generated HTTP contract:

| Condition | Status | Stable `code` extension | Retry-After |
| --- | --- | --- | --- |
| Missing, null or disallowed POST Origin | 403 | `CHAT_ORIGIN_REJECTED` | None |
| Retained conversation belongs to another session, including lost browser ownership | 404 | `CHAT_CONVERSATION_NOT_FOUND` | None |
| Committed turnId is reused with a changed message/context | 409 | `CHAT_TURN_CONFLICT` | None |
| Session or IP token budget exhausted on send/history | 429 | `CHAT_RATE_LIMITED` | Positive integer seconds, rounded up from the failed bucket's refill delay |
| Another turn is active in the same authorized conversation | 429 | `CHAT_CONVERSATION_BUSY` | Retry hint of 1 second |
| Per-instance LLM invocation capacity is occupied, once model integration exists | 503 | `CHAT_CAPACITY_EXCEEDED` | Retry guidance finalized in the future model-feature contract |
| Any required chat storage/control component is unavailable or its result is unknown | 503 | `CHAT_UNAVAILABLE` | No invented recovery time; manual recovery must verify readiness |

Rate/conversation-busy rejection appends no conversation pair and does not refresh
history retention. Denied requests do not enter the fixed-answer/model path.
Quota counters may change according to the charging policy above. Return 400
for invalid inputs when the earlier IP gate has not already rejected them.
Services throw protocol-independent exceptions; the HTTP boundary/handler owns
statuses, ProblemDetail and headers.
The LLM-capacity response is a model-integration contract handoff; do not claim
that the current fixed-answer route can exhaust LLM permits.
The shared unavailable response covers failures of Redis, rate enforcement,
session/history state and serialization; expose no internal dependency details
in its public message. Capacity exhaustion is distinct from a broken bulkhead.
Do not refresh history/session activity on a rejected attempt; an acknowledged
write or an unknown commit outcome must be handled through reconciliation, not
an assertion that every failed HTTP request left Redis unchanged.

## Accepted Browser Lifecycle

- Recover or create the conversation binding, then load history before enabling
  message submission. Keep loading separate from sending and expose a readable
  English restore error with manual retry if loading fails.
- Restore persisted messages once; a route change or a repeated effect must
  not duplicate messages or repeat an already submitted request.
- Preserve the existing in-memory draft, open state and pending/retry behavior
  during navigation. After a full reload, restore stored messages only; start
  collapsed with an empty draft and no restored pending/error state.
- During an active page session, manual send retry reuses the original turnId
  and payload. After full reload, reconcile the saved history, including pair
  turn IDs; do not reconstruct or automatically resend an uncommitted pending
  request. Any new intentional send receives a new turnId. Missing history
  after expiry/restart cannot prove whether an older request ever committed.
- If history is empty, show the existing local greeting and initial prompts.
  Otherwise, show restored messages and keep initial prompts hidden.
- Use the existing API boundary and mode selection. Explicit mock mode must
  exercise the same history shapes and reload lifecycle without a backend;
  components must not import fixtures, and API errors must not switch to mocks.
- On a rate/busy rejection, keep the failed payload and visible user entry.
  Honor Retry-After as a cooldown for manual retry, without automatic resend or
  another user entry. Keep restore cooldown/error state separate from send
  errors. A busy response is not an assistant conversation message.
- On `CHAT_UNAVAILABLE`, enter the shared unavailable state for the widget,
  preserve the displayed transcript/draft and block send/send-retry. Manual
  recovery uses a readiness-verified history retrieval and reconciliation; only
  its success permits further sending. Failed recovery keeps chat closed and
  never automatically retries the original message or activates mocks.

## Accepted Decision Register and Remaining Evidence

The user accepted D-001–D-011. Current-feature policy is settled; library
qualification is execution work and actual LLM N/budget amounts are explicitly
deferred. T0016-001 finalizes exact implementation file allowlists, focused test
selectors and representation/configuration details without reopening accepted
policy. No runtime task is authorized by this documentation update.

| ID | Topic | Accepted decision / remaining delivery work |
| --- | --- | --- |
| D-001 | Browser ownership | Redis anonymous session and opaque HttpOnly/SameSite=Lax cookie, Secure under HTTPS; sessionStorage conversation UUID; exclusive server owner, foreign UUID 404, no transfer after cookie loss; POST Origin validation; align 24-hour binding/cookie retention; cookie name/path/config annotations finalized in the binding ticket |
| D-002 | Context bounds | Latest 10 complete pairs and 20,000 characters including deterministic reference/context representation; discard oldest whole pairs, omit an oversized newest pair, preserve stored history; future model-token budget includes prompt/RAG/output allowance |
| D-003 | Activity | Only a newly completed persisted pair refreshes the 24-hour history/deduplication TTL and aligned owner/session/cookie lifetime; GET, replay, navigation and rejected/failed attempts do not refresh |
| D-004 | Retry identity | Required client UUID turnId; same authorized identity/payload replays the exact committed result, changed payload 409; atomically persist identity/pair/response; retention-bounded guarantee; reconcile history after loss/reload without automatic POST |
| D-005 | Rates and charging | Accepted configurable burst/refill table, separate send/history session/IP budgets; IP before session allocation, replay charged, no refund of consumed tokens; 429/Retry-After; full-recovery expiry plus 60 seconds; no strict rolling-minute claim |
| D-006 | Bucket4j qualification | Accepted candidate 8.21.0 at matching explicit artifact versions with existing JDK 23 / Boot 4.1.1 / managed Lettuce; compile/concurrent real-Redis/expiry evidence remains in T0016-007; no second client or implicit downgrade |
| D-007 | Conversation concurrency | Reused conversation SemaphoreBulkhead maxConcurrentCalls=1/maxWaitDuration=0 plus owned lease; initial deadline 120 seconds, lease 150 seconds, renewal every 30 seconds; owner-checked commit/release, actual-work permit lifetime, safe inactive-entry cleanup; single-backend delivery |
| D-008 | Trusted client address | Explicit proxy allowlist and overwritten/removed incoming forwarding headers; direct peer otherwise; canonical IPv4/IPv6 and Docker/host/spoofing verification remain in T0016-008 |
| D-009 | Resilience4j and LLM N | Accepted candidate 2.4.0, minimal programmatic resilience4j-bulkhead; stack qualification remains in T0016-009; future independent shared LLM maxConcurrentCalls=N is selected by model/hardware load measurements with zero wait |
| D-010 | Future overall budget | Shared daily token budget and daily cost budget for paid providers; atomic reservation/actual settlement, unknown usage retains reserve, reliable ledger separate from transcript TTL; amounts/reset boundary/pricing/storage and runtime delivery belong to the model feature |
| D-011 | Failure and recovery | First required-component failure closes chat with 503; initial logical Redis-operation timeout 1 second; one controlled startup/manual verification using isolated service-only keys, no user quota consumption, then authoritative history reconciliation; other application routes remain available; no extra endpoint or automatic message retry |

## Scope Boundaries

This feature supersedes feature 0012's reload-clears-history behavior and its
prohibition on server history/browser conversation binding. Once persistence
is implemented, its controller DTO-construction exception ends; restore the
normal controller/service/repository and mapper boundaries.

Exclude model calls, Spring AI memory wiring, exact/semantic search, embeddings,
RAG, Kafka events, analytics, streaming, PostgreSQL schema changes, chat
reset/deletion controls and a multiple-conversation UI. Historical demo links
retain the existing details/not-found behavior; checking live search results
belongs to the later search features. Reuse existing web/Redis dependencies;
adding the qualified Bucket4j and conversation-bulkhead Resilience4j artifacts
is the selected dependency direction. LLM-bulkhead runtime wiring and token/cost accounting belong to model integration,
so do not add unused model adapters or budget infrastructure to this delivery.
Any dependency/property/proxy files required for this extension must
appear in the finalized task allowlists before implementation; no such runtime
files are changed by this planning update.

## Implementation configuration

Exact cookie, origin/proxy settings, storage representation, counting, registry
and probe lifecycle are defined in [plan.md](plan.md#final-implementation-details-t0016-001).
The exact file allowlists and focused selectors are in [tasks.md](tasks.md#exact-implementation-boundaries-t0016-001).
