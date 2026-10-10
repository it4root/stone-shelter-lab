# Feature 0016: Execution Plan

Status: Policies D-001–D-011 accepted; continuous implementation is authorized.
Exact implementation tickets are finalized; runtime evidence is recorded in
[acceptance.md](acceptance.md#execution-evidence). Browser smoke remains pending.
Requirements live in [spec.md](spec.md), acceptance criteria exclusively in
[acceptance.md](acceptance.md), and task boundaries in [tasks.md](tasks.md).
The discussion and decision history is in
[ADR-0008](../../docs/adr/0008-chat-memory-and-request-protection.md).

## Existing Integration Points

- `StoneChatbotController` currently constructs the fixed response directly.
  Its DTO-construction exception and the stub-only architecture test must be
  replaced when server persistence is introduced.
- `StoneChatMessageRequest` already includes the conversation UUID, message
  and captured page context. `StoneChatMessageResponse` contains text and
  ordered `StoneChatStone` references; retain that response shape.
- `ChatSessionProvider` already spans navigation but generates a new UUID on
  mount and keeps all messages only in React state. Add restoration there,
  keeping the provider above page switching.
- `chatbotApi.ts` selects real HTTP or explicit mock mode. Extend this boundary
  for history retrieval; do not move transport or fixtures into components.
- Feature 0014 provides Redis and its starter plus `CHAT_MEMORY_TTL=PT24H`.
  Reuse that setup. The inspected POM already includes the web and Redis
  starters, but no Bucket4j or Spring Session dependency. Qualify Bucket4j and
  the Resilience4j artifacts required for conversation-scoped admission before
  adding dependencies; no database migration is planned.

## Accepted Policies and Implementation Ticket Gate

The user accepted D-001–D-011: anonymous cookie-bound Redis sessions and
tab-scoped sessionStorage UUIDs; a 10-pair/20,000-character context window;
write-only 24-hour history activity; required turnId/replay and 409 conflicts;
the initial session/IP bucket table; one-backend conversation serialization
with zero wait, 120-second deadline, 150-second lease and 30-second renewal;
trusted proxy/POST Origin rules; and functional fail-closed recovery with an
initial 1-second logical Redis-operation timeout. History GET and committed
replay do not refresh retention. These are accepted starting settings, not
pending user selections.

Bucket4j 8.21.0 and Resilience4j 2.4.0 are accepted qualification candidates.
Their compatibility evidence remains in their explicit dependency tasks.
Future model N is selected from model/hardware load measurements; daily
token/cost amounts, reset boundary and ledger implementation belong to that
feature. No absent future component blocks the fixed-answer chat.

T0016-001 finalizes exact permitted paths/test selectors and technical
representation/configuration details: cookie name/path and frontend-origin/
proxy settings, Redis value/schema operations, deterministic character counting,
safe registry retirement and probe-key cleanup. These details must implement
the accepted policies. Do not edit whole modules or execute runtime tasks
because documentation was accepted.

## Bucket4j Assessment and Redis Ownership

Bucket4j is a suitable rate-limiter candidate: its official
[reference](https://bucket4j.com/8.17.0/toc.html#lettuce-integration) documents
distributed Redis/Lettuce buckets, atomic per-bucket consumption and
refill-based key expiration. The candidate release is explicitly
[8.21.0](https://github.com/bucket4j/bucket4j/releases/tag/8.21.0);
[artifact metadata](https://central.sonatype.com/artifact/com.bucket4j/bucket4j_jdk17-lettuce)
lists its core/redis-common dependencies and a provided Lettuce dependency.
Do not interpret its older documented client baseline as proof of compatibility
with this project's managed client: compile and real-Redis checks are required.
The reference link describes the mechanism, not a qualified 8.21.0 API call.

Use Bucket4j for token-rate state only. Session ownership, transcripts,
idempotency and in-flight work are separate application concerns. Reuse the
existing Lettuce client/configuration; the qualified JDK17 Bucket4j artifacts
must have an explicit matching version, without adding Redisson/Jedis or a
community Spring starter. Finalize exact dependency coordinates and stack-ADR
changes in T0016-001/T0016-007 before editing runtime files.

Redis stores separate session, history, send/history session/IP buckets and
active-conversation lease key families as specified in spec.md. Keep serialization
and expiry separate: deleting a history key must not reset a rate bucket;
history access must not grant a new quota. Session activity must keep its owner
binding valid for retained conversations. Redis loss can clear ephemeral state,
but Redis unavailability must not turn admission checks into automatic approval.

No extra session framework is selected. Use existing web and Redis facilities
for the accepted anonymous binding;
a Spring Session dependency would require an explicitly justified alternative
decision and a revised dependency ticket.

## Admission and Concurrency Approach

- Delegate rate/session policy to protocol-independent application services and
  Redis repositories. Keep headers, client-address/cookie binding and error
  rendering at the HTTP boundary; route failures through the normal handler.
- Validate POST Origin against the configured frontend-origin allowlist at the
  HTTP boundary; reject missing/null/disallowed origins with the agreed 403.
  Cookie creation/refresh and trusted client-address extraction remain protocol
  responsibilities; services receive the original Request DTO unchanged.
- Enforce the broad IP gate before allocating anonymous session records, then
  validate the binding/request and apply the session quota before resolving
  any committed replay. Apply processing guards for new work. Shared readiness
  precedes any successful admission. Separate bucket operations need not be
  one cross-key transaction; the documented no-refund
  policy must be covered by tests.
- Trust proxy forwarding only after both frontend paths and spoofed-header
  handling have been verified. If headers are not safely forwarded, the
  effective IP identity is the peer/proxy, and the session gate remains the
  primary per-browser control; do not invent an address from an arbitrary header.
- Serialize the authorized conversation, keyed by owner and conversationId,
  using its reused Resilience4j SemaphoreBulkhead with maxConcurrentCalls=1
  plus the separate owned Redis lease. Keep both from context retrieval through
  completed-pair persistence; different conversations in one session have
  independent locks and shared request-rate quotas. Use the accepted deadline
  120 seconds, lease 150 seconds and owner-checked renewal every 30 seconds;
  check current lease/conversation ownership atomically with pair/turnId/result
  persistence. Renewal failure/loss of ownership invalidates chat readiness.
- Qualify candidate Resilience4j 2.4.0 in T0016-009 and pin the minimal
  programmatically used `resilience4j-bulkhead` module after qualification. Its
  [release](https://github.com/resilience4j/resilience4j/releases/tag/v2.4.0)
  includes Boot 4 support; that statement is not stack-test evidence. No
  annotation/AOP starter is required for this selected integration.
  Manage conversation bulkhead entries
  by the conversation lifecycle; do not construct one per request or evict an
  entry while active work/admission can still reference it.
- The selected Redis version is 8.2.10: use token-checked Lua release rather than
  assuming a newer Redis command. The
  [Redis lock guidance](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)
  describes NX/expiry acquisition and owner-checked release. Lease expiry is
  crash cleanup, not proof that active work has stopped.
- Acquire/release conversation guards with structured cleanup. Qualify
  deadline/lease-loss behavior with controlled work so an expired lease or
  returned error cannot allow overlapping/stale processing under the agreed
  policy. Provider cancellation belongs to later model integration.
- Deliver 0016 with one backend process. Local live-work tracking is the
  exclusion guarantee in that scope; a Redis lease is not proof that processing
  stopped after expiry. A multi-process/surviving-provider execution protocol
  requires its own specification and verification before widening this scope.

## Full Fail-Closed Availability Approach

Use a shared application-level readiness decision for the required chat
components: Redis-backed session/ownership, transcript/context access and writes,
Bucket4j enforcement, and conversation bulkhead/lease enforcement. All chat
paths, including history and any committed replay, obey that decision. A failed
or indeterminate operation invalidates readiness and closes subsequent chat
requests across conversations; protocol-independent exceptions become the
agreed 503 ProblemDetail in the handler. Ordinary quota or busy results remain
normal rejections and do not invalidate component health.

Use the accepted initial 1-second timeout for a logical Redis operation,
including bounded internal CAS retries; do not give each retry an unlimited
new budget or blindly retry uncertain mutations. Reachable Redis is necessary
but insufficient:
an unavailable limiter or broken serialization component must close chat even
when a transcript read would work. Do not add fallback buckets, transcripts,
guard bypasses or a new health endpoint. Avoid probes that consume a user's
quota, grant ownership or start processing solely to establish readiness.

At startup and on manual recovery through the existing history route, allow
one controlled verification attempt. Concurrent attempts remain unavailable;
do not add a probe queue, polling loop or health endpoint. Use isolated
short-lived `chat:probe:{probeId}:*` keys to exercise Redis read/write,
Bucket4j consumption and owner-checked lease operations through the actual
configured components. Verify local serialization initialization and active-work
tracking; clean up only the probe's own data. Success from an older attempt
cannot overwrite a newer failure. Only all-component success plus authoritative
history reconciliation permits browser sending. Chat readiness does not drive
application liveness or disable independent catalog routes.

Check readiness before new processing, and propagate dependency failures from
each actual operation. An admitted turn can still fail later; stop progression,
request supported cancellation, retain permits until work exits and attempt
only owner-checked lease cleanup. Return success only after confirmed atomic
persistence. A Redis acknowledgement failure is an unknown outcome; reconcile
authoritative history and accepted D-004 turn identity before a manual retry,
without pretending the operation rolled back.

The UI uses a shared unavailable state alongside its separate restore/send
states. Preserve visible history, draft and failed payload; disable send and
send-retry. A manual recovery uses the existing history route to validate
readiness and reconcile saved history. Failed recovery stays closed; successful
recovery permits a deliberate send/retry under D-004. No automatic resend or
switch to mocks is introduced. Explicit mock mode remains a development mode,
not an outage-recovery path for API mode.

Add actual LLM capacity and token/cost controls to the required-component set
when their separately specified runtime integrations are delivered. Do not
install unused controls in this fixed-answer feature. The current failure
matrix tests each introduced component, shared closure, in-flight uncertainty
and verified recovery with controlled failures and real Redis where relevant.

## Selected LLM-Concurrency and Budget Boundaries

The selected per-instance invocation mechanism is
[Resilience4j SemaphoreBulkhead](https://resilience4j.readme.io/docs/bulkhead),
with independently configured maxConcurrentCalls=N and
maxWaitDuration=0; model/hardware load tests select N in the model feature.
The value maxConcurrentCalls=1 belongs
to each conversation's separate serialization bulkhead. Its registry is local
to an application instance; it does not coordinate several backends. Share one
LLM bulkhead across providers/models in that instance and wrap the actual call,
retaining its permit until execution ends. Configuration and optional
[Micrometer metrics](https://resilience4j.readme.io/docs/micrometer) are the
reason to prefer the ready bulkhead over manual semaphore management.

No actual model call exists in 0016. Define and review this integration policy
here; reuse the qualified library and implement LLM runtime wiring/tests in
the first feature that introduces model calls. Do not add an unused model
adapter or pretend the fixed demo answer exercises LLM concurrency. No
ThreadPoolBulkhead, new work queue or shared global semaphore is selected.

Overall budget enforcement is a separate component with a shared daily token
budget and daily cost budget for paid providers. The model feature defines
amounts, reset boundary/time zone, usage units/pricing and reliable shared
ledger storage. Reserve a conservative input/output usage/cost bound before
invocation, settle actual usage, and keep unknown-usage reservations until
reconciled. A request may invoke the model multiple times;
one rate token or one bulkhead permit cannot represent that total cost. Record
this handoff without introducing a ledger/schema/provider-pricing integration
in 0016. Budget storage and recovery requirements require their own contract.
Their required-component failure behavior inherits the full fail-closed policy.

## Backend Approach

1. Represent stored conversations/messages/reference values independently of
   HTTP DTOs under the required responsibility packages. Redis is the only
   history store; the repository owns serialization, reads, atomic completed
   turn appends, write-only expiration refresh and committed-turn deduplication.
   Avoid a read/modify/write sequence that can lose or interleave turns.
2. Use a `StoneChatbotService` for application orchestration. Keep controllers
   responsible for binding, validation, routing and headers. Request/entity and
   entity/response mappers handle transformations; service methods return ready
   responses, including the history collection wrapper. Use the normal mapper
   base classes, names and return-value conventions.
3. Move fixed-answer assembly into the application/mapping path, retaining the
   demo result. Successful send responses follow successful persistence.
   Translate protocol-independent storage/control exceptions into the agreed
   ProblemDetail response in `ApiExceptionHandler`.
4. Add the agreed history GET route and DTOs; document both routes through
   controller/DTO annotations. Remove the controller-construction exemption
   from `ArchitectureTest` and replace the obsolete stub-only assertions in
   `StoneChatbotArchitectureTest` with the normal layer rules.
5. Implement a model-independent context selector over stored completed turns.
   Apply the confirmed window/budget without modifying Redis history. Define
   the character-count representation, including reference/context metadata,
   deterministically in its tests. Exercise it directly; do not add an unused
   model call or forward history through an HTTP request to a model.

Records are allowed only for types with at most four fields. Larger types use
private fields, a no-argument constructor and public getters/setters. Response
wrappers are built inside DTO mappers. Redis behavior must not rely on the
service's database `@Transactional` annotation for atomicity; the repository
must provide that guarantee through Redis operations.

The request gains required turnId while retaining message/context validation
and the two-field send response. History entries gain turnId for both members
of a pair and have five fields, so their shared DTO is a class. Repositories
atomically persist pair/turnId/original response under owner checks, and compare
the original message/context before committed replay; conflicts become 409.
Replay is quota-charged but takes no processing permit and refreshes no TTL.
Maintain an exclusive UUID owner lookup so another session cannot create a
second transcript under the same retained conversationId. Newly committed turns
align session/cookie/owner retention with history; GET/replay do not extend it.

## Frontend Approach

1. Add history DTOs and a retrieval function to the existing API boundary.
   Validate restored data using the same response/error conventions as sending.
2. Recover the confirmed browser binding in `ChatSessionProvider` and restore
   history before enabling sends. Protect against repeated effects, unmounts,
   stale completions and duplicate hydration while preserving navigation state.
3. Keep restoration loading/error/retry separate from message pending/error/
   retry. Render stored text and ordered references through the existing widget
   and canonical route helper. Persist only the selected binding in API mode;
   the visible transcript comes from Redis.
4. Extend the explicit mock adapter to model history and reload retention at the
   API boundary. Its development-only persistence must remain separate from API
   mode and follow the confirmed identity/expiry/retry behavior.
5. Extend API error metadata and manual retry handling for the agreed codes and
   Retry-After cooldown. Preserve the failed request, avoid automatic retries,
   and keep restoration cooldown separate from a failed send. Test quota and
   conversation-busy behavior with
   controlled rejection responses/time; explicit mocks do not need to emulate
   a multi-client distributed limiter.
   Generate a UUID turnId per intentional send and reuse the original ID/payload
   for manual retry within the page session. Use restored pair turn IDs for
   reconciliation; full reload restores committed history only and never
   reconstructs or automatically resends an uncommitted pending request.
   Explicit mocks implement pair IDs, replay/conflict and write-only TTL through
   the same API boundary, without a distributed limiter or real model.
6. Add the shared chat-unavailable state and manual readiness/history recovery.
   Do not enable sends after a failed restore or merely because a cooldown
   elapsed; do not convert an unavailable transcript into an empty one.

## Delivery Order and Verification

Execute tasks only after a separate implementation request, one requested task
at a time. Use the dependency order in tasks.md; creating the list does not
authorize executing it, committing or pushing.

Start with finalized implementation tickets/allowlists, qualify Bucket4j and add
anonymous sessions, then qualify Resilience4j/implement conversation guards,
implement owner-checked Redis history storage, context selection and shared
fail-closed readiness, followed by HTTP orchestration and UI restoration;
record the LLM bulkhead/budget handoff. Finish with
scoped API/mock reload smoke checks and acceptance review. Tests use the actual
Redis behavior for atomicity/TTL and controlled UI promises for async state.
Exact test selectors must appear in the task before execution; no full suite
is planned. Do not read build/dependency/configuration files during this feature
unless its explicitly agreed dependency/property/proxy ticket requires them.

Focused runtime checks and actual HTTP/proxy smoke are recorded in acceptance.md.
T0016-006 remains unchecked until the outstanding browser smoke is performed.

## Final implementation details (T0016-001)

- Cookie: `stone_chat_session`, host-only Path `/api/v1/chat`, HttpOnly,
  SameSite=Lax, Secure from the direct HTTPS connection. Max-Age equals retained
  session lifetime; only initial allocation or a newly committed pair sets it.
- Environment configuration: `CHAT_ALLOWED_ORIGINS` and `CHAT_TRUSTED_PROXIES`
  are explicit comma-separated literal origin/peer allowlists, empty by default.
  Forwarded scheme is never used for trust. Vite removes Forwarded and overwrites
  X-Forwarded-For with its connection peer, preserving the browser Origin. Both
  host and Docker UI paths use this same Vite configuration.
- Each history key contains one versioned JSON document of complete turns;
  a turn contains turnId, exact request message/context, answer and ordered stones.
  Lua validates owner, session, lease and prior document before replacing the
  entire document and aligning TTLs atomically. Reads/replays never write TTL.
  Invalid serialization/schema is an unavailable result, not an empty transcript.
- Count UTF-16 code units (`String.length`) in canonical per-turn JSON containing
  message/context/text/stones in that fixed order; IDs and field separators count.
  Context selection drops oldest complete pairs until both limits hold.
- Registry map admission/retirement uses atomic per-key compute and reference
  tracking. Retire only when every admission/execution reference exits; no active
  entry can be recreated. Deadline marks the turn invalid; it does not free the
  permit before execution exits. Lease renewal and commit check ownership.
- Probe keys have a unique `chat:probe:{UUID}:` prefix and short TTL; cleanup
  deletes only keys created by that attempt, with token checks for owned leases.
  Shared readiness uses fault generations so old probe success cannot clear a
  newer failure. Startup and manual history recovery share a zero-wait probe gate.
- HTTP binding is performed by a chat-only MVC interceptor before body validation:
  readiness, IP quota, POST Origin, session cookie. Controllers delegate original
  DTOs and HTTP-independent session identity to application services; session
  quota/ownership precede replay. Cookie headers remain at the HTTP boundary.

## Model-feature handoff (T0016-010)

The future model ticket must first specify measured hardware/provider capacity N,
provider cancellation and actual invocation lifetime, daily budget amounts and
reset timezone/boundary, price versions and reliable ledger storage. Its runtime
acceptance must verify one shared instance-wide zero-wait invocation bulkhead,
conservative input/output/cost reservation before each call, settlement of known
usage and reconciliation of retained unknown reservations. Both controls join
chat fail-closed readiness once active. Feature 0016 implements none of those
provider/accounting mechanisms; the demo answer and history use no LLM permit.

Lease values contain the random owner token and a Redis-TIME-based processing
deadline. Atomic completed-turn append rejects an expired processing deadline
even if the lease remains alive after renewal; cleanup cannot release a different
owner. Local permit lifetime still extends to actual execution exit.
