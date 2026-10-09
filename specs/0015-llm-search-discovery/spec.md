# Feature 0015: LLM Search Discovery

## Goal

Define the scope and sequence of independently deliverable features for a
chatbot that searches the stone catalog, uses reference documents, remembers
the conversation and collects search analytics.

This is discovery documentation; implementation belongs to subsequent feature
specifications. Decisions are recorded in
[ADR-0007](../../docs/adr/0007-llm-search-discovery.md); acceptance criteria belong
in [acceptance.md](acceptance.md).

## Scope and Starting Stack

- English only. Russian-language support and stone-card localization are out
  of scope.
- Use the existing PostgreSQL/pgvector, Redis, Kafka and host Ollama setup.
- Chat model: `qwen2.5:3b`. Embedding model: `qwen3-embedding:0.6b`,
  1024-dimensional vectors. Verify quality and speed on representative queries.
- Prepare for connecting external APIs when needed; the user will perform a
  one-time manual check of that connection. Local Ollama is the initial runtime.
- Retrieval sources are stone-card data and Markdown reference documents;
  keep raw sources available independently of the vector index.

## Agreed Search Behavior

- Ask clarifying questions when the user's wishes are insufficiently specified.
- Answers may use cards, reference documents and general model knowledge;
  general knowledge does not establish undocumented properties of a specific stone.
- Present up to five stones. If more are found, show the first five, explain
  that more matches exist and ask questions to narrow the request.
- Order semantic results by relevance and exact results by admission date,
  newest first. If no stones match, only report the absence of matches.
- Return links to actual stones and check their current existence/availability
  against the catalog, allowing for delayed index updates.

## Agreed Feature Sequence

### 1. Conversation History and Context

Store messages and stone references in Redis for 24 hours after the last
activity. Preserve history across page navigation and restore it after a page
reload. History may be lost when the stack restarts. Use a bounded portion of
history as model context.

### 2. Markdown Document Indexing

First verify the embedding model and establish the pgvector schema. Explicitly
import Markdown, split it by stone type/topic and retain source metadata.
Support replacement/removal of indexed fragments; folder watching is excluded.
The initial example is
[stone-encyclopedia_en.md](../../stone-rules/stone-encyclopedias/stone-encyclopedia_en.md).

### 3. Stone-Card Embeddings

Reuse the embedding setup to convert card data into searchable text, index
existing cards and provide internal semantic retrieval.

### 4. Shared Reliable Event Publication

Provide PostgreSQL outbox publication to Kafka. Save a stone and its indexing
event in one transaction, return the HTTP response after commit and publish
the event in the background. Preserve events during Kafka outages and retry
delivery. Reuse this mechanism for analytics with separate event contracts.

### 5. Stone-Card Index Updates

Process creation, relevant changes and deletion through Kafka consumers that
update embeddings and pgvector. Support retries and manual reindexing. A delay
in semantic-search freshness is acceptable.

### 6. Exact LLM Search

Verify the chat model, interpret catalog filters and query PostgreSQL through
bounded application operations. Use conversation context for clarification and
follow-ups; return answers through the existing JSON chat endpoint.

### 7. Semantic Search and RAG Answers

Combine card retrieval, document passages and exact filters to answer requests
such as choosing a stone for a shelf. Provide explanations, clarification and
follow-up answers using the agreed search behavior.

### 8. Reliable Analytics Publication

Define the analytics AsyncAPI contract and publish query text, the found count
and only the presented stones through the shared outbox/Kafka mechanism.
Exact-search counts cover all database matches; semantic-search counts cover
found candidates before presentation is limited to five.

### 9. Analytics Storage

Consume Kafka analytics events and store the query text, count and presented
stones in PostgreSQL. Handle duplicate delivery without duplicate records.

### 10. Streaming API and Widget

Add a separate streaming endpoint and integrate it into the existing widget.
Display text incrementally and deliver stone links with the completed answer.
Define completion, errors and retries, preserving conversation behavior during
navigation.

## Contract Requirements

Generate HTTP contracts from Spring MVC controllers and shared DTOs; generated
OpenAPI remains the source of truth. Define separate indexing and analytics
AsyncAPI contracts before Kafka implementation.
