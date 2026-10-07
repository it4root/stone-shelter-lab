# Add Stone UI — Technical Plan

Requirements: [spec.md](spec.md). Acceptance criteria:
[acceptance.md](acceptance.md). Checklist: [tasks.md](tasks.md).

## Contract and Mock Boundary

Review generated backend OpenAPI from feature 0008 before adding frontend DTOs.
Add dedicated StoneCreateRequest, StoneCreateResponse and
StonePhotoDraftUploadResponse under src/api/dto, reusing StonePhotoResponse and
the existing named enum types. Keep creation request/response types distinct
from detail DTOs even when their current properties overlap.

Extend the existing API boundary with asynchronous createStone(request) and
uploadStonePhotoDraft(file) operations backed by mock adapters. No fetch, HTTP
mock server, new dependency or handwritten HTTP contract is needed.

Read selected files with browser FileReader in the mock upload boundary and
return data URLs in contract-shaped upload responses. This retains real selected
image bytes in memory without object-URL lifetime/revocation problems when the
creation page unmounts. Generate UUID references and ISO timestamps with a
24-hour interval; do not simulate expiry or server image validation.

Store drafts and created stones in runtime mock maps; allocate numeric stone
and gallery IDs above existing fixture maxima. Creation maps references to
ordered photo entries, copies request data and records a new runtime stone.
Merge additions into catalog reads before filtering, sorting and pagination.
Detail reads resolve both fixtures and additions, then apply the existing
reservation overlay. Never mutate fixture arrays/objects or expose mutable
internal arrays through returned responses. Provide test reset helpers for all
new runtime state; preserve reservation reset isolation.

Keep mock operations successful for valid UI requests. Do not introduce random
failures, outage toggles, backend status enforcement or a repair mechanism.

## Form and Photos

For T0009-007, remove the visible details legend/introduction and the static
Name/type/size/Biography helpers. Keep the form's accessible name and native
required controls. Build aria-describedby only from active field errors.
Shorten photo help to formats and count/size
limits and remove CSS used only by the deleted legend/introduction.

Keep page components, local orchestration and validation in src/features/add-stone.
Use AddStonePage/AddStonePage.tsx and a feature-owned photo selector/preliminary
gallery component with colocated CSS/tests. Reuse domain enum labels, design
tokens and the existing placeholder. Do not make Common/PageLayout own form
state or catalog-specific filter layout on this page.

The user-requested grid revision replaces the large creation preview and lower
thumbnail list with one 16-slot grid at the top of PhotoDraftGallery. Render four
columns at every supported width. Occupied slots contain the image, cover/position
label and accessible removal control; unoccupied slots are neutral unnumbered
placeholders. Keep draft orchestration and submission references unchanged.

Use a feature hook for form values, field/selection errors, uploaded references,
upload progress and creation success. Separate selected upload references from
the eventual managed photo IDs. Validate detail limits locally. Remove admission
date from form state, validation, reset and StoneCreateRequest. The mock adapter
assigns its current UTC instant when creating the response, matching T0008-009.

Process upload batches in file-selection order and append their successful
responses in that order, irrespective of promise completion order. Disable
photo mutations during a batch; details remain editable. Reject invalid batches
before invoking uploads. Ignore late completions after leaving/resetting the
form so they cannot populate another form. FileReader data URLs need no explicit
revoke call; reset unused mock draft state through the adapter's test lifecycle.

Build the creation request once from the valid current form, with AVAILABLE
and ordered UUIDs, omitting admissionDate. Guard pending submission
before awaiting the adapter, disable editing and show an accessible progress
state. Success replaces the form with confirmation/identity/navigation. Reset
only through Add another stone or a new route visit. Photos are not required.

## Routing and Catalog Refresh

Extend ApplicationPages and the existing history-based navigation hook;
recognize /stones/new and its trailing-slash variant before parsing numeric IDs.
Add the catalog entry link within the existing page navigation surface, keeping
Header/Footer composition. Do not add a routing library solely for this route.

Invalidate the current catalog response after a successful mock write using a
small refresh callback/version in the existing catalog session hook/provider.
Recompute from the API boundary with the same session parameters. This prevents
the provider's precomputed response from hiding a new runtime stone; it does
not require another global store or polling. Keep route/form state local to the
creation feature and preserve existing scroll/history behavior.

## Verification and Delivery

Use Node 24.21.0, npm 11.19.0 and the existing locked dependencies. Cover payloads,
server-owned timestamps, invalid selections, zero/one/16 photos, pending guards, immutable
fixtures, readback/totals, reservation compatibility, fresh forms and routing.
Use isolated mock state and deferred promises for repeatable tests.

Run npm run lint, npm run test -- --run and npm run build for frontend tasks.
Use a real browser for responsive/focus/history checks; record unavailable
checks as pending. Reuse or start the local Vite server, verify its HTTP response,
leave it running and report its URL after implementation verification.

The user authorized continuous execution of all remaining tasks after T0009-001.
No commits or pushes are authorized here.
