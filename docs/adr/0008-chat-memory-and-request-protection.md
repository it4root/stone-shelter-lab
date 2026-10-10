# ADR 0008: Conversation Memory, Request Protection and Fail-Closed Chat

Date: 2026-10-10

Status: Accepted. The user accepted the recommendations for D-001–D-011,
including initial limits/timeouts, retry identity, session ownership, one-backend
delivery and recovery policy. Library versions are accepted qualification
candidates; compatibility checks and runtime delivery have not been performed.
Actual LLM concurrency and budget amounts remain future-model decisions.

## Context and Authority

The user requested review and documentation for
[feature 0016](../../specs/0016-llm-search-conversation-history-and-context/spec.md),
followed by discussion of request limits, Redis responsibilities, alternatives
to a JDK semaphore and dependency failure behavior. The initial instruction
explicitly prohibited starting implementation. Subsequent instructions expanded
the documentation scope and requested this ADR; they did not authorize code,
dependency changes, tests, commits or pushes.

This ADR records the discussion in this conversation, including proposals that
were later corrected. It continues
[ADR-0007](0007-llm-search-discovery.md) and the conversation-memory requirements
in [feature 0015](../../specs/0015-llm-search-discovery/spec.md).
Acceptance criteria live exclusively in
[0016 acceptance.md](../../specs/0016-llm-search-conversation-history-and-context/acceptance.md);
implementation decisions and tasks live in the sibling plan.md and tasks.md.
This record does not establish runtime enforcement or replace those documents.
Sections 1–7 record the decisions and proposals at each earlier discussion
stage; section 8 records their acceptance and supersedes earlier pending wording.

## Discussion Record

### 1. Review History and Context Without Implementation

The user asked whether feature 0016 was clear enough to implement and requested
acceptance criteria, an execution plan and tasks. The inherited goal was Redis
history for 24 hours after the last activity, including messages and ordered
stone references, retained during navigation and restored after a full reload.
Loss of ephemeral history after a local stack restart was acceptable. Stored/UI
history and the bounded context supplied to a future model were separate.

The existing widget supplied a conversation UUID, page context and a fixed
JSON answer, but retained history only in React memory and generated its UUID
on provider mount. The plan therefore covered Redis storage, a history route,
browser restoration, model-independent context selection and removal of the
controller-only stub's architecture exception. Real LLM calls, search, RAG,
Kafka and streaming were outside feature 0016.

The goal was clear, but browser ownership, context limits, the definition of
activity and lost-response retry semantics remained unresolved. The proposed
starting points were an anonymous HttpOnly cookie session plus tab-scoped
sessionStorage UUID, the latest 10 complete pairs within 20,000 characters,
and TTL refresh on successful sends and successful existing-history reads.
Those questions received no explicit selection at this stage. Section 8 later
accepts the identity/context recommendations and selects write-only TTL refresh.

### 2. Check Whether Discovery Already Included Rate Limits

The user asked whether feature 0015 already protected against excessive
requests from curious users. The discovery documents did not specify rate
limits, concurrent-request admission or a 429 contract. Such behavior could
not be inferred from the presence of Redis or a future model.

### 3. Add Request Protection and Evaluate Bucket4j

The user explicitly added request protection to feature 0016 and asked whether
Bucket4j could use Redis alongside conversations and sessions. The proposal
separated Redis key families for ownership sessions, transcripts, request-rate
buckets and active work; these records have different meanings and lifetimes.

Use a primary anonymous-session quota and a broader IP gate. Changing a
conversation UUID must not reset the user quota. Clearing the cookie can create
a new anonymous session, so the IP gate should precede session allocation.
IP is an abuse-control signal, never proof of conversation ownership; shared
networks require a broader limit to avoid treating unrelated users as one owner.

Bucket4j with Redis was selected for request rate. Its official Lettuce
integration supports distributed bucket state; candidate version 8.21.0 still
requires compilation and real-Redis qualification with the project's JDK 23,
Spring Boot 4.1.1 and managed Lettuce client. Reuse that client and explicitly
pin qualified artifacts. No second Redis client or unrelated starter was selected.

The initial proposed rate settings were:

| Operation | Session capacity / refill | IP capacity / refill |
| --- | --- | --- |
| Send | Burst 3; refill 10 requests/minute | Burst 10; refill 60 requests/minute |
| History | Burst 5; refill 30 requests/minute | Burst 20; refill 120 requests/minute |

These are token-bucket capacities and continuous refill rates, not a strict
rolling-minute count. The numbers were unconfirmed at this stage. Send and
history have separate budgets so send exhaustion does not prevent restoration. Bucket expiry
must not restore capacity earlier than full refill; a 60-second grace was
proposed. History/session activity must not reset rate counters.

The conservative proposed charging order is IP gate, binding/validation,
session quota, optional committed replay, then processing guards for new work.
Already consumed request tokens are not refunded after a later rejection or
processing failure. Replay still consumes request-rate quota, but does not
start another turn or incur model usage. Separate buckets and transcript writes
do not constitute one implicit atomic transaction.

Client-IP handling needs explicit proxy trust and verification through both
Docker frontend and host Vite paths. Otherwise the peer can be the frontend
proxy for every browser. Untrusted forwarding headers cannot select a quota.

An early concurrency proposal used an active-session Redis lease and an
instance-wide JDK semaphore with a starting value of 1. These were proposals,
not accepted final choices. The later conversation-specific decisions below
superseded both the session-wide serialization scope and that instance value.

### 4. Compare Alternatives to a JDK Semaphore

The user asked for best practices and more established alternatives. The
discussion distinguished local concurrency, distributed permits and provider
resource controls instead of treating them as interchangeable limits:

| Option | Discussion outcome |
| --- | --- |
| JDK Semaphore | A valid local primitive, but application code owns configuration, lifecycle, rejection handling and observability; the selected solution uses Resilience4j |
| Resilience4j SemaphoreBulkhead | Selected for local concurrency control with configuration, events and optional Micrometer integration; still local to an application instance |
| Resilience4j ThreadPoolBulkhead | Adds a bounded executor/queue; no queued chat work or additional thread pool was selected |
| Redisson RPermitExpirableSemaphore | A distributed permit option with expiry, useful if a shared deployment limit is required; not selected because that requirement is absent and it introduces another Redis client |
| Ollama concurrency/queue settings | Provider resource controls, complementary to application admission; they do not enforce browser quotas or conversation ownership, and no host settings were changed |

A library name alone does not make concurrency global or solve cancellation.
A permit remains occupied until execution really exits; an HTTP timeout or
client disconnect does not establish that model work has ended.

### 5. Accept Four Separate Responsibilities

The user supplied the responsibility table: Bucket4j/Redis for requests per
user, separate conversation serialization for one active turn, Resilience4j
SemaphoreBulkhead for N model calls per application instance, and independent
token/cost accounting for the overall LLM budget. These boundaries were accepted.

Serialization moved from the whole session to the authorized conversationId.
Different conversations in one session retain their shared user quota but can
process concurrently. The full turn guard covers history/context reading through
atomic completed-pair persistence, preserving context and answer order.

The separate LLM bulkhead applies to actual model invocations across all
conversations/providers/models within one instance. Creating separate N-permit
pools per provider would multiply the intended instance limit. Multiple backend
instances each have their own pool; no deployment-wide LLM cap was selected.

Request tokens and concurrency permits do not measure prompt/output tokens or
cost. The future model feature must define budget amount/period, usage units,
reservation before invocation, settlement, retries and unknown usage, plus a
shared/durable ledger where needed. An ephemeral 24-hour transcript store is
not implicitly a financial ledger. Feature 0016 documents these model boundaries
without adding an unused model adapter, provider integration or budget ledger.

### 6. Clarify maxConcurrentCalls=1

The user explicitly required maxConcurrentCalls=1 for a specific conversationId.
The final interpretation is a reused conversation-scoped Resilience4j
SemaphoreBulkhead with one permit, plus an owned Redis conversation lease.
It is not a session-wide lock or the instance-wide LLM bulkhead. Constructing
a fresh bulkhead for every request would provide no conversation limit.

The lease checks distributed ownership; the local bulkhead tracks live work.
Release/commit must verify the lease token, and active entries cannot be evicted
and recreated while admission or execution still references them. Lease expiry
is crash cleanup, not proof that a live worker stopped. A 120-second deadline,
150-second lease and zero wait were proposed; renewal, ownership loss and safe
registry cleanup remain to be finalized. A Redis lease alone is not evidence
that overlap across expiry is prevented.

The independent future LLM bulkhead uses maxConcurrentCalls=N, with N still
open. The current fixed answer and history reads take no LLM permits. Required
Resilience4j artifacts are qualified for conversation serialization first;
actual LLM wiring and provider cancellation tests belong to model integration.

### 7. Require Full Fail-Closed Chat

The user required the whole chat to fail closed if Redis, the rate limiter or
another component storing history or evaluating controls becomes unavailable.
This strengthened the earlier Redis-only unavailable response into a shared
chat-availability policy. It is an accepted requirement, not an optional setting.

Required components in feature 0016 include session/ownership state, transcript/
context operations and writes, session/IP rate enforcement, and conversation
bulkhead/lease enforcement. Uninitialized, timed-out, failed, unreadable or
indeterminate results close chat whenever safe state or admission cannot be
established, even if Redis itself remains reachable.

Known dependency unavailability closes send, history and selected committed
replay across conversations with HTTP 503 ProblemDetail. There is no local
memory, cached-response, empty-history, mock or guard-bypass fallback. Do not
begin answer processing after failed admission or return success for an
unconfirmed completed-pair write. Healthy quota exhaustion and a healthy busy
conversation remain ordinary 429 rejections; occupied LLM capacity is also
distinct from a broken concurrency component.

Already displayed messages and the draft remain visible, while send/send-retry
are blocked. Manual recovery must verify required components and reconcile
history before reopening sending, without automatically resending a message.
Healthy, authoritative absence after expiry/restart remains a normal empty
conversation; a failed read must never be interpreted as that absence.

An admitted turn may fail later. Stop progression and request supported
cancellation, retain permits until execution exits and perform owner-checked
cleanup. A lost Redis write acknowledgement can leave a complete commit
uncertain; fail-closed does not prove rollback. Resolve that outcome against
authoritative history and the selected retry identity policy after recovery.

When real model calls are introduced, their required capacity and token/cost
controls inherit this policy. Those future components are not required to start
the current fixed-answer feature. Bounded fault detection, shared readiness
invalidation and verified startup/recovery are open implementation details in
D-011; they must preserve the accepted policy. No instantaneous distributed
fault detection, extra health endpoint, automatic retries or circuit breaker
was selected by this discussion.

### 8. Accept Recommendations and Update Feature Documents

The user requested advice for every unresolved point, then explicitly accepted
those recommendations and instructed that they be recorded first in this ADR
and then in the feature specification, acceptance criteria and tasks. The plan
is aligned as part of that documentation update. This is acceptance of the
requirements and starting settings, not authorization to implement or evidence
that dependency qualification or runtime checks passed.

| Decision | Accepted policy |
| --- | --- |
| D-001 | Server-issued anonymous Redis session; opaque cryptographically random cookie with HttpOnly, SameSite=Lax and Secure under HTTPS; conversation UUID in sessionStorage; ownership checks for every request; foreign UUID returns 404, and losing a cookie does not transfer a retained conversation; validate POST Origin as part of CSRF protection |
| D-002 | Select at most the latest 10 complete pairs within 20,000 characters including references/context; remove oldest whole pairs; preserve full stored/UI history; model integration later uses a token budget with room for system/current/RAG/output content |
| D-003 | Retain history for 24 hours after the last newly completed turn is persisted; GET/history viewing and committed replay do not extend it; align owner session/cookie lifetime with retained conversations |
| D-004 | Require a client-generated turnId, reused for retry; atomically store the complete pair, identity and response; same ID/payload replays the result, changed payload returns 409; deduplication is bounded by retention; reconcile history without automatically repeating POST |
| D-005 | Continuous token buckets: send session burst 3/refill 10 per minute, send IP burst 10/refill 60; history session burst 5/refill 30, history IP burst 20/refill 120; separate budgets, IP first, replay charged, no refund of already consumed tokens; 429 with Retry-After; expiration after full recovery plus 60 seconds |
| D-006 | Qualify Bucket4j 8.21.0 modules at matching explicit versions with the existing Lettuce client; compatibility requires compilation and concurrent real-Redis consumption/expiry checks |
| D-007 | Reuse one conversation bulkhead with maxConcurrentCalls=1 and maxWaitDuration=0; retain the permit until execution exits; owned Redis lease, 120-second deadline, 150-second lease, renewal every 30 seconds and owner-checked write/release; safely retire inactive entries; deliver 0016 with one backend process |
| D-008 | Explicit trusted-proxy allowlist; remove/overwrite incoming forwarded headers at the trust boundary; use the connection address for direct requests; qualify Docker/host paths, spoofing and IPv4/IPv6 |
| D-009 | Qualify Resilience4j 2.4.0 using the minimal programmatic resilience4j-bulkhead module; the release documents Boot 4 support but does not replace stack checks; independently choose future shared LLM N from model/hardware load measurements |
| D-010 | Future shared daily token budget and cost budget for paid providers; reserve before invocation, reconcile actual usage, retain unknown-usage reservations until resolved, and use reliable accounting separate from transcript TTL; amounts, reset boundary and ledger implementation belong to the model feature |
| D-011 | First detected required-component failure closes all chat operations with 503; initial Redis-operation timeout is 1 second; startup/manual recovery uses one controlled verification attempt exercising actual components on service-only keys, then reconciles history; probes do not consume user quota; no automatic message replay; other application routes remain available |

The earlier proposal to refresh history on successful reads is superseded by
write-only activity. The numeric limits are accepted initial configurable
settings, with later tuning based on measurements rather than claims of a
universal optimal value. An actual new pair refreshes retention; a successful
replay does not write another pair or prolong its deduplication window.

Single-backend delivery is part of the accepted serialization contract. The
local permit provides live-work exclusion there; lease expiration alone cannot
establish that a worker stopped. Multiple backend processes or real provider
calls continuing after application failure require a separately specified
ownership/execution protocol before a stronger guarantee can be claimed.

## Final Decisions

| Responsibility | Selected mechanism | Scope |
| --- | --- | --- |
| Request rate | Bucket4j and Redis | Accepted anonymous-session and broader IP gates with separate send/history buckets |
| One active turn | Reused Resilience4j SemaphoreBulkhead, maxConcurrentCalls=1, with owned Redis lease | Each authorized conversationId for the complete turn |
| LLM invocation concurrency | Separate Resilience4j SemaphoreBulkhead, maxConcurrentCalls=N | Actual model calls across providers/models in each instance; future integration |
| Overall LLM budget | Independent token/cost accounting | Separately specified shared budget and accounting; future integration |
| Dependency availability | Full fail-closed chat | Every active required state/control component; send, history and replay close together |

Redis holds separate session, transcript, rate and active-conversation state.
Their lifetimes are independent: session/history retention is 24 hours with
write-only activity, buckets live through full refill plus 60 seconds, and
active-turn state uses a 150-second owned lease renewed every 30 seconds.
The local conversation and LLM bulkhead registries are not
Redis rate counters. This separation permits independent policy and cleanup.

## Remaining Delivery Work and Future Decisions

The current policy decisions D-001–D-011 are accepted as recorded above.
Remaining preparation covers exact implementation file allowlists, focused
test selectors, representation/configuration details and dependency qualification
evidence. Candidate Bucket4j 8.21.0 and Resilience4j 2.4.0 must not be reported
compatible before their checks pass. Future LLM N, token/cost amounts, daily
reset boundary, provider-specific accounting and ledger storage are deferred
to the separately specified model feature; they do not block this fixed-answer
delivery or introduce unused runtime components.

The HTTP contract remains generated from controllers and shared DTOs. The
accepted history route, dependency-unavailable code and other error metadata
are specified in feature 0016; no handwritten OpenAPI document is introduced.
Failure detection must cover broken components as well as a Redis outage, and
recovery must establish readiness rather than rely on elapsed time or a ping.

The documentation task list now includes shared fail-closed availability before
HTTP/UI integration. Runtime tasks remain unchecked and require explicit
execution instructions, exact file allowlists and focused
test selectors. Neither library compatibility, concurrency enforcement,
browser reload behavior nor fail-closed recovery has been runtime verified.

## Primary References Used in the Discussion

- [Bucket4j Redis/Lettuce reference](https://bucket4j.com/8.17.0/toc.html#lettuce-integration),
  [8.21.0 release](https://github.com/bucket4j/bucket4j/releases/tag/8.21.0)
  and [artifact metadata](https://central.sonatype.com/artifact/com.bucket4j/bucket4j_jdk17-lettuce):
  distributed bucket mechanism and candidate coordinates, not proof of managed
  client compatibility.
- [JDK 23 Semaphore](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/util/concurrent/Semaphore.html):
  the original local concurrency primitive.
- [Resilience4j bulkheads](https://resilience4j.readme.io/docs/bulkhead) and
  [Micrometer integration](https://resilience4j.readme.io/docs/micrometer):
  local semaphore/thread-pool choices and observability.
- [Redisson permit-expirable semaphore](https://redisson.pro/docs/data-and-services/locks-and-synchronizers/#permitexpirablesemaphore):
  the discussed distributed-permit alternative.
- [Ollama concurrent-request guidance](https://docs.ollama.com/faq#how-does-ollama-handle-concurrent-requests):
  provider-side resource controls.
- [Redis distributed-lock guidance](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/):
  expiry and token-checked release; the existing Redis 8.2.10 setup needs a
  compatible Lua operation rather than assuming a command added in 8.4.
- [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
  and [CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html):
  cookie/session protections and source-origin validation.
- [Spring AI memory/history distinction](https://docs.spring.io/spring-ai/reference/api/chat-memory.html):
  separate complete transcripts from bounded model context.
- [AWS idempotent API guidance](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/):
  caller request identity, atomic recording and changed-parameter rejection.
- [Spring forwarded-header guidance](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/ForwardedHeaderFilter.html):
  the trusted ingress must remove untrusted forwarded headers.
- [Resilience4j 2.4.0 release](https://github.com/resilience4j/resilience4j/releases/tag/v2.4.0):
  candidate release with documented Spring Boot 4 support.
- [Bedrock token reservation/settlement](https://docs.aws.amazon.com/bedrock/latest/userguide/quotas-token-burndown.html):
  an example supporting the future accounting design, not a selected provider.
- [AWS timeout guidance](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/):
  bounded remote calls and measurement-based timeout tuning; 1 second is this
  project's accepted initial Redis setting.

## Qualification evidence (2026-10-10)

T0016-007 qualified Bucket4j 8.21.0 with the existing managed Lettuce client,
JDK 23.0.2 and real Redis 8.2.10. T0016-009 qualified the minimal programmatic
Resilience4j bulkhead 2.4.0 in the single-backend scope. Exact artifact pins and
focused verification are recorded in [ADR-0001](0001-stack-versions.md#feature-0016-request-protection-pins-2026-10-10);
feature [acceptance evidence](../../specs/0016-llm-search-conversation-history-and-context/acceptance.md#execution-evidence)
separates automated tests, HTTP/proxy smoke and the unavailable browser checks.
These results do not qualify model invocation capacity, provider cancellation
or financial accounting.
