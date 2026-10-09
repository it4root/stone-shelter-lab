# 1. Conversation History and Context

Status: Planned.

Store messages and stone references in Redis for 24 hours after the last
activity. Preserve history across page navigation and restore it after a page
reload. History may be lost when the stack restarts. Use a bounded portion of
history as model context.

Source and shared requirements: [LLM Search Discovery](../../0015-llm-search-discovery/spec.md#1-conversation-history-and-context).
