# ADR 0007: LLM Search Discovery and Interim Decisions

Date: 2026-10-09

Status: Partially accepted. Confirmed decisions include the initial model choices,
search behavior, Kafka/outbox indexing flow and current delivery exclusions.
Remaining implementation details and the full feature sequence are under
discussion. Model quality and performance still require verification.

## Context

The user requested a discussion and planning document for natural-language stone
search, card/document RAG, conversation memory, Kafka analytics and streaming.
Infrastructure feature 0014 is complete, and feature 0012 supplies a fixed
chatbot response. Infrastructure readiness does not establish these application
behaviors or model capabilities.

Representative requests include a red stone for a shelf, a stone for playing
with a cat, and all available basalt stones. These require discussion of exact
catalog constraints, semantic matching, supporting knowledge and clarification.

This entry records the intermediate discussion on 2026-10-09. It is not a final
implementation specification or an authorization to execute future tasks.

## Confirmed Discovery Workflow

- Perform discovery in
  [0015-llm-search-discovery](../../specs/0015-llm-search-discovery/spec.md).
- Produce staged future feature scopes and numbered ticket outlines, with ADRs
  recording decisions reached during the discussion.
- Continue as an analyst helping the user choose behavior, stack and scope.
  Change documentation only after a direct user instruction. The current
  instruction authorizes updating this ADR only.
- Include both stone-card data and separate documents about stone types as
  intended retrieval sources.
- Plan conversation context, Kafka search analytics and a separate streaming
  endpoint as bounded work areas.
- Preserve the selected infrastructure as the starting point. No host model
  download or infrastructure replacement is authorized by discovery.
- Follow the existing generated-OpenAPI and AsyncAPI ownership rules when later
  feature contracts are defined. This ADR creates no runtime contract.

## Confirmed Product and Scope Decisions

### Languages and Localization

- The current delivery scope works in English only.
- Russian-language support and stone-card localization are outside this scope
  and are excluded from the current feature list.
- Earlier discussion identified a future bilingual/localized direction, but
  that direction is not an additional implementation stage authorized here.

### Providers and Resource Budget

- Both chat generation and embeddings run locally through Ollama initially.
- Prepare the provider boundary in advance so an external API can be connected
  when needed. The initial runtime remains local through Ollama.
- The user will perform a one-time manual check of external-API connectivity
  and behavior when that connection is used. That check has not been performed
  or claimed successful during discovery.
- No specific external provider, credentials, automatic fallback or rollout
  timing has been selected. Provider readiness does not expand this scope into
  implementing an unspecified catalog of external-provider integrations.
- This is a pet project with minimal resources. Exact hardware capacities,
  corpus volume and latency targets have not been established.
- Use `qwen2.5:3b` for answer generation and `qwen3-embedding:0.6b` with
  1024-dimensional vectors for embeddings as the agreed initial model setup.
- Verify quality and speed on a small representative set of the user's queries
  before treating that setup as qualified. Agreement on the starting models is
  not evidence that their integration, structured output or retrieval works.
- The [official Qwen model card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)
  documents multilingual support and a maximum 1024-dimensional output; the
  [Ollama artifact](https://ollama.com/library/qwen3-embedding:0.6b) supplies the
  selected local embedding model. Actual vector length and resource use remain
  to be verified. No model download or runtime change is authorized here.

### Answers and Clarification

- If there is insufficient information about the user's wishes, the bot asks
  clarifying questions.
- Answers about properties and uses may rely on stone cards, reference
  documents and the model's general knowledge. Answers are not restricted to
  retrieved passages alone.
- When a search produces more than five results, present the first five,
  explain that additional matches exist, and ask specific questions to narrow
  the request, for example about size or intended use.
- This refinement behavior applies to the discussed exact request for all
  available basalt stones as well. A chat pagination/"Show more" flow was not
  selected.
- Order semantic results by relevance. For exact searches, use admission date
  descending, with the newest arrivals first, matching the catalog's ordering.
- When no stones match, only report the absence of matches. Do not propose
  changing search conditions as part of that zero-result response.
- Evidence presentation and handling of conflicting sources remain unresolved.

### Documents and Index Freshness

- Reference documents are Markdown.
- The supplied example is
  [stone-encyclopedia_en.md](../../stone-rules/stone-encyclopedias/stone-encyclopedia_en.md).
  One file covers all ten current stone types, with topic subsections, shared
  rating scales and a comparison table.
- The example distinguishes geological/physical information from fictional
  personalities and rituals. It also describes typical specimens rather than
  establishing individual properties of every catalog stone.
- Automatic folder watching is unnecessary. Document refresh is initiated
  explicitly through import/reindexing; the command or operator interface has
  not been chosen.
- A delay between a card change and its appearance in semantic search is
  acceptable. No precise freshness target has been selected.

### Kafka Indexing and Shared Reliable Publication

- Use Kafka for background stone-card indexing as well as for search analytics.
- Save the stone and its indexing event in a PostgreSQL outbox within the same
  database transaction.
- Return the HTTP response after the transaction commits, without waiting for
  Kafka publication, embedding generation or vector-index completion.
- A background dispatcher publishes the persisted outbox event to Kafka; a
  consumer generates the embeddings and updates the pgvector projection.
- Keep persisted events available for delivery after a Kafka outage. Exact
  retry limits, event payloads and consumer recovery rules remain to be defined.
- Implement the shared reliable-publication capability before automatic
  background indexing, and reuse it for analytics publication.
- Define separate AsyncAPI contracts for indexing and analytics. Their shared
  transport does not make them the same event or business workflow.
- This agrees the stone-save flow and its delivery mechanism; exact triggers
  for relevant updates/deletion and whether explicit Markdown imports also
  submit Kafka work remain details for continued discussion.

### Conversation History and Model Context

- Visible conversation history survives navigation between pages.
- Restore the previous conversation after a full page reload as well.
- Conversation history does not need to survive a restart of the local stack.
- Retain the conversation for 24 hours after the last activity; an inactive
  conversation expires after that period.
- The 24-hour policy concerns conversation retention, not analytics retention
  or the amount of history sent to the model.
- Storage/identity mechanics and the model-context window remain implementation
  proposals below, rather than finalized contracts.

### Kafka Analytics

- Store the user's query text, the number of results found and only the stones
  actually presented to the user, up to five. Do not store the full list of
  unpresented candidates as the analytics result list.
- For exact searches, the found count is the total number of database matches.
  For semantic searches, it is the number of candidates found before limiting
  presentation to five. The latter depends on retrieval settings and is not
  represented as a complete count of all matching stones in the database.
- If Kafka is temporarily unavailable, preserve the analytics events and
  deliver them after Kafka recovers. Losing events during that outage is not
  an acceptable normal delivery policy.
- The existing planned direction remains application -> Kafka -> PostgreSQL.
  Analytics retention and the exact event schema are not yet defined.
- The representation of presented stones, such as IDs versus result snapshots,
  remains to be specified.

### Streaming

- Plan a separate streaming endpoint for the chatbot.
- Display answer text incrementally.
- Deliver links to found stones together with the completed answer.
- Stream event names/payloads, cancellation, failure, retry and completion
  persistence rules remain unresolved.

## Technical Proposals — Not Yet Finalized

These recommendations were discussed but were not individually confirmed as
final implementation choices. Preserve that distinction when writing features.

### Model Verification and Retrieval

- The model setup above is now an agreed starting choice. The evaluation set,
  minimum acceptable quality/latency, artifact digest and provider integration
  checks have not been finalized or performed.
- Keep chat and embedding provider selection independent. Switching embedding
  profiles requires compatible queries and indexed vectors, with a rebuild
  when the vector space changes.
- Use bounded catalog operations for exact constraints and separate semantic
  retrieval for card/document evidence. Model-generated SQL is not proposed.
- Preserve distinct evidence roles: cards describe specific specimens,
  documents describe types, and general model knowledge supplements explanations
  without establishing undocumented properties of an individual stone.
- Recheck candidate existence and availability against live catalog data before
  returning links; index lag should not expose deleted or unavailable results.

### Markdown Processing and Card Refresh Details

- Split the encyclopedia by stone type and topic, with language/type/source
  metadata and section provenance. Keep shared sections explicitly scoped.
- Mark fictional character/ritual content distinctly from physical properties.
  Exact metadata and citation presentation have not been selected.
- Define card creation, relevant-change and deletion triggers over the agreed
  Kafka/outbox mechanism. Source-version ordering, retry bounds and operator
  repair remain open; the transport itself is no longer an unresolved choice.

### Memory Implementation

- Use the existing nonpersistent Redis for server conversation history and
  bounded model context, with the agreed inactivity TTL.
- Persist a browser-side conversation/session binding so reloads can request
  server history. Browser storage versus cookie/session mechanics are undecided.
- Preserve message order and structured stone references so follow-ups such as
  "the second stone" resolve to the previously presented result.
- Select only a bounded window of history for LLM context. The history shown
  to the user and the messages supplied to the model are separate concerns.
- A client UUID is a correlation identifier, not proof of conversation
  ownership. Anonymous session binding, expiration and stale-binding behavior
  need a future contract.

### Reliable Delivery Details

- PostgreSQL outbox publication is now accepted as the shared mechanism for
  indexing and analytics. Its schema and dispatcher/consumer contracts remain
  future implementation work.
- Use a stable event ID and idempotent consumer persistence to handle duplicate
  delivery. These details are proposed; the delivery requirement and outbox
  mechanism above are confirmed.
- Retain result order to support ranking analysis. Routing, filters, durations,
  errors and other operational metadata are suggested additions, not confirmed
  event fields.
- Keep analytics delivery independent of the token stream; define behavior if
  the initial durable event write fails before implementation.

### Transport and Feature Boundaries

- Share turn behavior between complete JSON delivery and SSE delivery rather
  than implementing different search logic for each transport.

The [roadmap](../../specs/0015-llm-search-discovery/plan.md) proposes exact catalog
chat first, followed by card embeddings, document ingestion, index lifecycle,
grounded semantic chat, memory, analytics, backend streaming and UI streaming.
Directory numbers, sequencing and ticket sketches remain provisional. That
roadmap and the initial specification/question ledger have not been synchronized
by this ADR-only update; this ADR records the current discussion status.

The latest sequencing proposal is to implement Redis history and reload
restoration before LLM search, because clarification and follow-up turns need
previous conversation context. The user requested discussion of the complete
feature list and order rather than approving that sequencing proposal yet.

The subsequent Kafka discussion confirmed that shared reliable publication must
precede automatic background indexing and also serve analytics. The earlier
full feature-list proposal included Russian/localization and an external-API
rollout as later stages. Russian/localization is now excluded; external-provider
readiness and a user-performed manual check replace an assumed standalone
provider rollout. The remaining sequence still needs discussion.

## Open Decisions for Continued Discussion

The next discussion concerns the remaining feature list, independent scopes and
their order. Zero-result behavior, result ordering, analytics result scope/count
semantics, initial models and the shared Kafka/outbox flow are resolved above.

Remaining decisions include:

- Retrieval limits and how to determine that more than five semantic candidates
  exist without claiming a complete count of all relevant stones.
- How hard constraints, semantic preferences and conflicting sources interact;
  whether supporting documents/general model knowledge are visibly identified.
- A small representative model/retrieval evaluation set and acceptable quality/
  latency; verification of the selected chat model's tool/structured-output behavior.
- Card projection fields, Markdown chunking, source associations, document
  replacement/removal and profile rebuild behavior.
- Indexing event triggers/payloads, source-version ordering, freshness target,
  retry bounds and repair; whether explicit Markdown imports submit Kafka work.
- Conversation ownership/binding, history/context limits, reset behavior and
  duplicate/retried turn handling.
- Analytics ID/snapshot representation, retention, AsyncAPI schema and failure
  handling; distinguish the agreed exact and semantic count definitions.
- SSE lifecycle, partial/error/disconnect handling and the semantics of retry.
- External-provider selection, configuration details and the concrete scenario
  for the user's one-time manual check.
- Final feature scope, order and numbered tasks.

## Consequences

Discovery now distinguishes confirmed product choices from implementation
recommendations. Current delivery is English only; Russian/localization has
been removed from its feature scope. Explicit Markdown import bounds document
ingestion scope, while tolerated index lag permits background card processing.
The initial chat/embedding models are selected for verification. Chat result
presentation uses up to five stones and refinement questions when more are
found; zero matches produce only an absence-of-matches response.

With the proposed server-owned history, reload restoration needs history
retrieval and a browser binding that survives reloads, even though history may
be lost when the stack restarts. Kafka outage preservation requires reliable
handoff and recovery. Memory and analytics have separate storage/retention
requirements.

Stone writes and indexing-event persistence share a transaction, while Kafka
delivery and embedding work run in the background. Reliable publication becomes
a prerequisite for automatic indexing and a reusable analytics capability.
External-provider readiness is planned with manual verification owned by the
user; it does not constitute a completed external connection or automatic
provider fallback.

Future specifications must settle their own contracts, acceptance criteria,
exact writable files and permitted tests before implementation. No application
code, host setup, model inference, feature execution, commits or pushes are
authorized by this discussion record.

## Alternatives

- Implement search, ingestion, memory, analytics and streaming in one feature:
  inconsistent with the requested isolated stages and harder to verify incrementally.
- Treat current infrastructure settings as a completed memory/RAG contract:
  rejected because feature 0014 explicitly excluded application behavior.
- Treat agreement on initial models/dimensions as proof of runtime quality:
  rejected; model evaluation remains required and other technical mechanisms
  remain proposals until resolved.
- Automatic document-folder monitoring: not needed by the user; use explicit
  refresh instead.
- Chat pagination as the response to more than five matches: replaced by
  presenting the first five and asking questions that narrow the search.
- Require conversation durability across stack restarts: unnecessary for the
  agreed scope; page-reload restoration is still required.
- Drop analytics during a Kafka outage: rejected; preserve events for recovery.
- Suggest relaxed conditions automatically when no stones match: not selected;
  only report that no matches exist.
- Store every unpresented search candidate in analytics: not selected; store the
  found count and the presented stones instead.
- Wait for Kafka or embedding completion before returning a successful stone
  save response: not selected; commit the stone and outbox event, then perform
  publication/indexing in the background.
- Include Russian/localization in the current feature sequence: excluded by the
  user; preserve English-only delivery.
- Assume automated external-provider rollout/verification: not selected; prepare
  the connection boundary and leave the one-time manual check to the user.
