# 4. Shared Reliable Event Publication

Status: Planned.

Provide PostgreSQL outbox publication to Kafka. Save a stone and its indexing
event in one transaction, return the HTTP response after commit and publish
the event in the background. Preserve events during Kafka outages and retry
delivery. Reuse this mechanism for analytics with separate event contracts.

Source and shared requirements: [LLM Search Discovery](../../0015-llm-search-discovery/spec.md#4-shared-reliable-event-publication).
