# Feature 0012: Stone Chatbot UI and HTTP Stub

## Goal and Authorization

Add a basic English-language chatbot to the catalog and stone details pages,
using the expanded widget in [catalog.png](../0005-ui-mock-to-code/catalog.png)
and the collapsed launcher in
[stone_details_mock.png](../0006-stone-details/stone_details_mock.png) as visual
references. Establish an HTTP boundary for a future Spring AI implementation.

The user authorized continuous implementation of all remaining feature tasks.
Run tests only for the new chatbot functionality and its integration boundaries;
lint and build checks still apply. No commits or pushes are authorized.

Acceptance criteria are maintained exclusively in [acceptance.md](acceptance.md).
Technical decisions live in [plan.md](plan.md); work items live in
[tasks.md](tasks.md).

## Current Scope

- A collapsible chat widget with greeting, quick prompts, message input,
  conversation history, pending state, manual retry and stone details links.
- One client-generated UUID per mounted application session.
- Shared client state above page switching, preserving messages, open state,
  draft input and an in-flight request across navigation.
- A backend controller and shared DTOs returning a fixed response without
  business logic, AI, catalog queries or server conversation storage.
- Existing API and explicit mock modes, with chatbot mocking at the API boundary.

## HTTP Contract Requirements

Add `POST /api/v1/chat/messages`, consuming and producing JSON. A successful
request returns HTTP 200 with a dedicated response DTO directly, without
ResponseEntity or a Location header. Generated `/v3/api-docs` and
`/v3/api-docs.yaml` remain the HTTP contract source of truth. Describe the
operation as a stub in generated documentation; do not add a handwritten
OpenAPI document.

### Request

| Field | Type | Requirements |
| --- | --- | --- |
| conversationId | UUID string | Required and non-null; identifies the current client conversation |
| message | string | Required, non-null, nonblank, at most 2000 characters |
| context | object | Optional and nullable; describes the page at submission time |
| context.stoneId | integer, int64 | Optional and nullable; when present, positive and within the existing UI-safe stone identifier range |

Use the same safe positive identifier bound as existing frontend navigation;
the HTTP upper bound is 9007199254740991. UI submissions always include context:
`{"stoneId": id}` for a valid stone details route, otherwise
`{"stoneId": null}`. This context is a page identifier, not proof that a stone
exists. Do not query the catalog to validate it in this feature.

Example:

```json
{
  "conversationId": "9960a79a-ae24-4c89-9f54-51103bcb00c9",
  "message": "How do I care for this stone?",
  "context": { "stoneId": 3 }
}
```

Do not send conversation history, stone characteristics, model options, system
instructions, user identity or a server session identifier in this request.
Binding and Bean Validation belong to the controller boundary. Missing/invalid
required fields, malformed UUIDs/JSON, blank or oversized messages, and invalid
stone identifiers return HTTP 400 RFC 9457 ProblemDetail through existing error
handling. The backend does not trim or otherwise normalize message content.

### Response and Fixed Stub

The response contains exactly `text` and `stones`. `text` is a nonblank string;
`stones` is a non-null ordered array of objects containing exactly positive `id`
and nonblank `name`. An empty array is valid for this contract, although the
current stub returns the two entries below.

Every valid request returns the same payload, independent of conversationId,
message and context:

```json
{
  "text": "Here are some stones you might like.",
  "stones": [
    { "id": 1, "name": "Mars" },
    { "id": 3, "name": "Luna" }
  ]
}
```

These identifiers and names match the existing UI mock catalog. They are demo
references, not results selected from the real database. Do not seed or change
the real database to make the stub references exist. In API mode, a missing demo
stone uses the existing Stone not found page. The backend must not import UI
fixtures or validate availability.

### Explicit Controller Stub Exception

The user explicitly requested only a controller stub on the backend. For this
feature only, `StoneChatbotController` may construct the fixed shared response
DTO and its nested stone DTOs directly instead of calling a service or mapper.
This is an exception to the normal controller delegation/DTO-construction
rules, limited to the constant stub payload. It does not authorize business
logic, mapping requests, entity access, repository access, persistence or AI
calls in controllers. Other controllers retain all existing restrictions.

Use shared types `StoneChatMessageRequest`, `StoneChatContext`,
`StoneChatMessageResponse` and `StoneChatStone`. They live in
`lab.stoneshelter.shared`; no type has more than four fields. Existing record
and package rules still apply. Do not add a service, mapper, repository, entity,
migration or dependency for this stub.

## Conversation Lifecycle and Navigation

Generate a UUID with the browser's native UUID capability once when the shared
chat session is initialized. Keep it unchanged on open/close, send, failure,
retry, responsive changes and client-side route changes, including Back/Forward.
Distinct application sessions receive distinct UUIDs.

Mount the chat provider above the existing page switch. It owns the UUID,
chronological message list, complete assistant responses including the ordered
stone references, open state, draft, request/error state and asynchronous request
lifecycle. Pages and the visible widget must not own the request lifetime.

Navigation or collapse must not cancel, duplicate or resend a pending request.
When it completes, append the response once to the same conversation, even if
the originating page/widget is no longer visible. Snapshot message and context
when sending; navigation must not change that request. A later new submission
uses the newly opened page's context.

Show the widget on catalog and details pages only. Keep its provider alive on
other existing routes, hiding the widget without clearing the conversation or
interrupting a request. Returning to catalog/details restores its state.

Do not use localStorage, sessionStorage, IndexedDB, cookies or server persistence
for the chat in this feature. A full browser reload starts a new conversation,
clears messages/draft/errors and returns the widget to its initial collapsed
state. Cross-tab and cross-device synchronization are outside scope.

## Widget Behavior

Initially show a round green chat launcher at the bottom right. Clicking it
opens the panel; clicking it again or the panel close button collapses it.
Collapsing does not erase the conversation. The expanded panel follows the
reference's rounded light surface, green accents, header, message bubbles,
quick prompts and bottom composer. Label it Stone Shelter Chat. Identify the
current functionality as a demo; do not claim that AI or a knowledge base is
already connected.

Show an English greeting locally once per conversation; it makes no request.
Offer these initial quick prompts, each sending the corresponding text through
the same submission path as typed input:

- Help me choose a stone
- Tell me about stone properties
- How do I care for a stone?
- Another topic

Hide the initial prompts after the first user submission. Render user and
assistant messages chronologically. Render response text as plain text and each
returned stone as an ordinary accessible link using the existing canonical
`/stone-shelter/stones/{id}` route helper. Preserve response order. Do not parse
stone names or URLs out of response text. No Markdown/HTML rendering or stone
cards, photos, adoption controls or favorites are required inside the chat.

The composer has a visible/accessible input label and a send button. Enter
submits; avoid submitting during IME composition. UI validation rejects blank
or oversized input and explains the length limit in English. Send the entered
message without backend normalization. After a valid submission, append one
user message, clear the composer and show an accessible waiting indicator.
Allow only one request at a time per conversation: guard submissions and disable
send/quick-prompt/retry controls while pending.

On failure, retain the user message and previous conversation, show an accessible
English error and a manual Retry control. Retry resends the failed request with
its original UUID, message and page context, without appending the user message
again. Do not automatically retry or show a successful assistant message on
failure. Until retry succeeds, keep new submissions disabled to preserve turn
order. Normalize HTTP/network/malformed-response failures through the existing
API error conventions. Never switch to mocks after an API error.

Keep the latest message/waiting/error state visible when the chat is open and
restore the latest conversation view when reopened. Message history scrolls
inside the panel; header and composer remain usable.

## Responsive Layout and Accessibility

On desktop, use the catalog's reserved right-hand chat area when expanded and
release that space when collapsed; preserve the existing four-column catalog,
filter behavior and page controls. On details pages use a floating panel without
adding a permanent catalog-style column. On tablet/mobile use a panel contained
within the viewport, with usable input and internally scrollable history.
Neither state may cause horizontal page overflow.

Use semantic buttons, keyboard-visible focus, an accessible panel name,
aria-expanded/aria-controls on the launcher and hidden controls that cannot
receive focus. Opening places focus in the composer; closing via the close
button or Escape restores focus to the launcher. The chat is nonmodal: do not
trap focus or make the entire page inert. Existing filter/adoption modal
behavior takes precedence; the chat must not bypass their focus/inert rules.
Announce new responses, waiting and errors without repeatedly reading the full
history. Respect reduced-motion preferences for any transitions.

## API and Mock Modes

Reuse feature 0011's transport, environment configuration and mode selection.
Provide a promise-returning chatbot API boundary, with an HTTP adapter in API
mode and a lazy-loaded fixed-response adapter in explicit mock mode. Both use
the same request/response shapes and fixed payload. Components/providers do not
import mock fixtures. No new proxy setting, HTTP client or dependency is needed.

## Future Spring AI Boundary — Not Implemented Here

Later work will bind conversations to a user or anonymous server session,
validate conversation ownership, store full structured history on the server
and restore model memory by conversationId. The current UUID is a correlation
identifier, not authentication or proof of ownership.

Future model context must retain the ordered stone identifiers from assistant
responses so follow-up questions such as "the second one" can be resolved.
Server memory, history retrieval, retention policy and persistence across browser
reloads require a separate specification. The current feature neither emulates
conversation memory on the backend nor forwards client history to a model.

## Relationship to Existing Features and Exclusions

This feature supersedes only the chatbot exclusions/reserved-only chat area in
features 0005 and 0006. Preserve their other requirements and the routes and
API/mock behavior from features 0010 and 0011. Earlier feature documents and
verification records remain unchanged.

Exclude Spring AI/model dependencies, real recommendations, semantic search,
tool calling, RAG, streaming, Kafka, server conversation/session storage,
authentication, history endpoints, database changes, chat reset/deletion,
uploads, multiple conversations, persisted browser state, automatic retries,
real database seeding and deployment.
