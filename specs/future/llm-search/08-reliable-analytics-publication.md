# 8. Reliable Analytics Publication

Status: Planned.

Define the analytics AsyncAPI contract and publish query text, the found count
and only the presented stones through the shared outbox/Kafka mechanism.
Exact-search counts cover all database matches; semantic-search counts cover
found candidates before presentation is limited to five.

Source and shared requirements: [LLM Search Discovery](../../0015-llm-search-discovery/spec.md#8-reliable-analytics-publication).
