# Feature 0006: Stone Details from the Catalog

## Goal

Let a visitor open the details of a specific stone by clicking its photo in the
catalog. Build an English-language responsive page using
[stone_details_mock.png](stone_details_mock.png) as the visual reference, showing
contract-backed stone data, including the ordered photo gallery added in this
feature and backend photo storage in MinIO.

## Accepted Decisions and Scope

- The catalog photo is the entry point to the selected stone's details page.
  This includes the placeholder when the stone has no usable photo.
- Open a dedicated page, rather than an overlay or a selection mode. Identify
  the stone by its unique id, never by its name or position in the current page.
- Include one large displayed photo and a thumbnail carousel below it. By
  default, the first added photo is the main photo. Store uploaded photo files
  in MinIO through the backend and retain their order across later visits.
- Use the mockup's large image, adjacent information, characteristics and full
  description as visual guidance. The supplied scope takes precedence over
  extra fields and controls drawn in the image.
- Preserve the existing shared Header and Footer. Header labels remain static;
  do not add favorites, counters, adoption buttons or other header actions.
- Continue the mock-first UI scope of
  [feature 0005](../0005-ui-mock-to-code/spec.md): use the same 30 stones through
  the API boundary, without requiring a running backend.
- Use English interface labels and stone content. Reuse placeholder-rock.png for
  missing or failed images, preserving the existing supplied bitmap exception.
- The earlier adoption UX analysis was a proposal. This feature does not approve
  its form, contact fields, submission, reservation rules or status changes.

## Navigation

Keep the catalog at `/`; use `/stones/{id}` for a stone's details. Each catalog
photo must be a keyboard-accessible link with an accessible name identifying the
stone. Activating it opens that exact stone even after filtering, sorting or
pagination; it does not select a stone for a separate global action. Names and
other card content do not need new navigation controls in this scope.

The detail URL must work on direct entry and refresh using the mock data source.
Browser Back/Forward must navigate between catalog and details. Provide a visible
`Back to catalog` link in the page content, matching the mockup's navigation area;
keep it separate from the unchanged header. The current stone name may appear
as the final, noninteractive breadcrumb item.

When returning from details during the same session, retain the catalog's
filters, sorting, page size, page number, sidebar state and scroll position.
Opening details starts at the top of the details page. A direct details visit
with no previous catalog state returns to the normal catalog defaults: size 8,
Newest first, no filters and the existing responsive initial sidebar state.
Persistent storage across a new session is not required.

An unknown id or malformed detail URL shows an English `Stone not found` state
with `Back to catalog`. Do not silently display the first mock stone or empty
characteristics. Successful lookup is independent of the current catalog page
and filters; all existing stones can be addressed directly, including Reserved
and Adopted stones.

## Detail Content and Contract Mapping

Extend the existing backend StoneResponse with the gallery defined below. Render:

| Contract field | Visible content | Requirement |
| --- | --- | --- |
| photos | Ordered gallery and large selected image | The first added photo is initially selected; each entry supplies id, url, addedAt and position |
| photo | Backward-compatible catalog cover | First gallery photo when present, otherwise the existing legacy photo value or placeholder |
| name | Main page heading | Display the selected stone's actual name |
| id | Stone identifier | Display the actual id; do not invent formatted mock identifiers |
| stoneType | Type | Use the existing explicit English enum presentation mapping |
| stoneSize | Size | Small, Medium or Large; do not convert categories into centimeters |
| adoptionStatus | Status | Available, Reserved or Adopted using explicit English mapping |
| admissionDate | Admission date | Display a readable English UTC calendar date from the existing timestamp |
| biography | Biography/description | Show the complete text without the catalog's two-line truncation |

Keep the heading, image, characteristics and biography legible and clearly grouped.
Avoid duplicating the biography as an invented short story plus a separate
unavailable long description. Preserve paragraph/line breaks when supplied.
For absent/empty biography, reuse the English fallback `This stone’s story is
coming soon.` Do not invent measurements or descriptions to match the mockup.

## Gallery Behavior

Display one large selected image and a horizontal thumbnail carousel directly
below it, following the mockup. Default selection is the first photo in persisted
addition order. The catalog also uses this first photo as the stone's cover.
Adding another photo appends it and does not replace the existing first photo.

Clicking/tapping a thumbnail changes the large displayed image and marks that
thumbnail as selected. This is a local preview selection, not a change to the
persisted main photo or gallery order. Opening another stone or revisiting its
details starts with its first added photo. Manual main-photo assignment,
reordering, deletion, image editing and a full-screen lightbox are outside scope.

When the thumbnail strip exceeds its available width, allow horizontal movement
inside the strip with Previous photos/Next photos controls and touch scrolling.
These controls move the thumbnail strip; selecting a thumbnail changes the large
image. The strip does not auto-advance or loop indefinitely. Disable navigation
at its boundaries; hide unnecessary navigation when all thumbnails fit. Keep
selected thumbnails discoverable. Every thumbnail is a keyboard-operable control
with an identifying name, visible focus and an exposed selected state.

With one photo, show it as the main image and a single thumbnail without carousel
navigation. With no gallery photos, use the legacy single photo if available,
otherwise placeholder-rock.png, without fabricated thumbnails. A failed main
image or thumbnail uses the existing placeholder and must not trigger an endless
retry or change stored order. Other usable photos remain selectable. Provide
meaningful alternatives and usable image bounds in all states.

## Photo Storage and Addition Order

Backend photo upload is in scope so MinIO storage is a usable capability.
The visitor details page is a gallery viewer; a volunteer upload interface is
excluded by the authorized plan and deferred below.

Store uploaded image bytes in MinIO, not in database binary columns or frontend
source files. Persist metadata separately: photo id, stone association, object
reference, server-assigned addition timestamp and stable position. Database
metadata never stores a temporary signed URL as the canonical object reference.
The backend supplies browser-usable read URLs; MinIO credentials never reach the
frontend. Access policy and URL lifetime are technical-plan decisions.

Order photos by a stable per-stone addition position. First added means the
first successfully accepted/stored photo; failed uploads do not acquire gallery
positions. Assign positions on the backend and maintain deterministic order even
when timestamps coincide or uploads overlap. The client does not submit a main
flag or choose the order. A new upload appends after existing photos.

Retain the existing legacy photo string as a compatibility fallback. Do not
interpret old arbitrary photo values as MinIO object keys or automatically import
external files. Existing create/update photo inputs keep their accepted legacy
values; they do not clear or reorder the gallery. When gallery photos exist,
the read-side photo field projects the first gallery URL. If the gallery is empty,
it retains the legacy value. Adding uploaded photos may therefore replace the
legacy cover with the first managed gallery image.

Keep a failed upload from exposing a metadata entry for an unavailable object.
Document compensation for MinIO/database partial failures in the technical plan;
report storage errors with the existing ProblemDetail boundary and allow retry.
Deleting a stone must clean up its photo metadata and managed MinIO objects;
legacy external photo URLs do not represent owned objects to delete.

### Daily Deferred Cleanup

Run cleanup in a dedicated scheduler inside the existing backend. User requests
only persist cleanup intent; stone deletion and failed upload handling do not
issue immediate MinIO removal requests. Deleted-stone metadata is removed at once;
managed bytes remain until a successful scheduled cleanup. Failed upload intent
retains the existing 24-hour safety delay for interrupted attachments.

Use an environment-configurable daily cron and explicit timezone, defaulting to
03:00 UTC. Before processing, check MinIO write readiness with a short timeout.
If unavailable, skip the run and retain all work for the next scheduled day.
Process due work sequentially in small batches with configurable rate, object
count and elapsed-time limits. Stop the run on storage/database failure or thread
interruption; do not retry every queued object against an unavailable dependency.
A successful initial health check does not remove the need to handle later errors.
Protect attached photos under the existing database lock and retain durable work
across restarts. No HTTP route, DTO or database schema changes are required.

This scope uses the current single backend instance. A separate cleanup process
and coordination of daily runs across multiple backend replicas are deferred;
each additional scheduler instance would otherwise have its own run budget.

Before this feature, local Compose infrastructure had PostgreSQL and the API only.
Add MinIO service/configuration and persistent object storage as part of this
backend scope. Configure endpoint, bucket, credentials and browser-accessible
URL settings through environment variables, documenting examples without real
secrets. Select concrete MinIO image/client versions and record the dependency
reason in the technical plan/stack ADR before implementation. Do not use latest.
Add new Liquibase changesets for photo metadata; do not modify applied changesets.

## Visual and Responsive Requirements

Retain the established light background, green accents, rounded image treatment,
spacing, typography and shared design tokens. On desktop, use a large image on
the left and the selected stone's heading/information on the right, following the
mockup. The details page uses its own content layout; catalog filters and the
reserved catalog chatbot column do not belong on this page.

On tablet/mobile, adapt to available width; stack image and information when
side-by-side content would become cramped. Use the order: navigation, main image,
thumbnail carousel, heading/identity, characteristics and full biography. Do not require a separate
mobile mockup. The page must remain usable at 320 pixels without horizontal
scrolling, including long names and biographies. Keep the existing responsive
header behavior. All page navigation supports keyboard access and visible focus;
use a single main heading and semantic characteristics/description sections.

## Data and HTTP Contract Requirements

Generated backend `/v3/api-docs` and `/v3/api-docs.yaml` remain the HTTP contract
source of truth, as established in
[ADR-0004](../../docs/adr/0004-generated-openapi.md). The existing
`GET /api/v1/stones/{id}` returns HTTP 200 StoneResponse for a known stone and
HTTP 404 RFC 9457 ProblemDetail for an unknown stone. These are existing
requirements, not a new endpoint or a separate handwritten contract.

### Extended Read Contract

Extend `GET /api/v1/stones/{id}` StoneResponse with `photos`: an ordered,
non-null array (empty when no managed photos exist). Each entry contains:

| Field | Meaning |
| --- | --- |
| id | Stable photo identifier |
| url | Browser-usable image read URL |
| addedAt | Server-assigned timestamp of successful addition |
| position | Stable per-stone addition order |

Preserve the existing fields and the compatibility photo behavior above.
`StoneSearchResponse.photo` uses the same first-photo projection so catalog and
details agree on the default cover. Search pagination remains content/page/size/
totalElements; it need not return the full gallery per catalog entry. Existing
create/update JSON routes remain valid and do not mutate gallery membership.

### Upload Contract Requirements

Add `POST /api/v1/stones/{id}/photos` accepting one image as multipart/form-data
part `file`. A successful upload stores the bytes and associated metadata, appends
the photo, and returns HTTP 201 with a dedicated response DTO containing
id, url, addedAt and position. It does not change stone attributes or adoption
status. An unknown stone returns HTTP 404 without storing a photo. Missing/empty
or invalid input returns the appropriate documented 4xx ProblemDetail; storage
unavailability returns HTTP 503 ProblemDetail without adding a gallery entry.

Accept JPEG, PNG and WebP image files up to 10 MiB per file. Validate file
signature and declared media type. Missing/empty or corrupt image data returns
400, unsupported/mismatched media type returns 415, and an oversized upload
returns 413, all as ProblemDetail. Private MinIO objects use backend-generated
browser-accessible presigned read URLs lasting one hour. Persist object keys,
not temporary URLs. Technical details and compensation are in plan.md. Do not add batch-upload, delete-photo,
reorder-photo or set-main endpoints in this scope. Preserve existing stone
removal behavior while cleaning up managed gallery resources as described above.

Generate the expanded contract from controllers/shared DTOs, including multipart
requirements, photo responses and ordered-array semantics. Do not maintain a
handwritten OpenAPI document. Controllers own HTTP binding and statuses;
services coordinate validation/storage/metadata through protocol-independent
exceptions, and ApiExceptionHandler translates failures into ProblemDetail.
Repository queries own metadata ordering. Respect existing mapper boundaries.

### Frontend Mock Boundary

The UI continues to run without a backend or MinIO, using detail lookup and
mock gallery metadata through the API boundary. Reuse the same 30 stone identities;
provide representative zero-, one- and multiple-photo cases using the existing
placeholder-rock.png for every gallery image, as explicitly requested. Distinct
photo metadata identifies entries even when the bitmap is identical. Local assets
belong to mocks, not production storage.
Components must not import fixtures directly or search only the visible page.

Keep the detail DTO separate from search DTOs and align it with the expanded
generated contract. Preserve enum values and optional biography behavior.
Live frontend HTTP/upload integration remains outside the currently agreed UI
scope. Backend MinIO storage and its contract/schema extensions are explicitly
in scope; other unsupported mock characteristics remain excluded.

## Architecture Constraints

Follow the accepted feature-oriented architecture in
[ADR-0005](../../docs/adr/0005-ui-mock-to-code.md): feature-specific page/components
and hooks under `src/features`, reusable stone presentation under `src/domain/stone`,
API DTOs/access under `src/api`, and fixtures/adapters under `src/mocks`.
Each component has its own PascalCase directory with colocated styles/tests.
App remains composition; the shared header contains no detail or application state.

Add navigation only to support the documented catalog/details routes. Choose
implementation mechanics in the technical plan; no routing library or global
store is mandated by this specification. Reuse existing dependencies unless a
concrete implementation need justifies a documented addition. No empty future
application/service/store/provider layers are required.

## Explicitly Excluded Mockup Elements

- Region, country or location/origin beneath the name or in characteristics.
- Dimensions in centimeters, weight, color/swatches, shape, surface/finish and
  natural-origin attributes: none is supplied by the current StoneResponse.
- The statement/badge that every stone was found in nature with care/respect.
- Photo hearts, Add to favorites, favorites storage/counts and favorites pages.
- Header changes, new header buttons or navigation destinations.
- Floating chatbot launcher/icon, chatbot controls and messaging.
- Catalog-card adoption buttons, forms, submission, payment, delivery,
  reservation and adoption-status mutation.
- Live frontend/backend integration and general stone-editing UI. Backend photo
  upload/storage and gallery metadata changes are included as described above.

## Deferred Scope: Detail Adoption Action

The mockup also contains `Adopt this stone`. The authorized implementation plan
excludes this action and the application flow. The deliverable covers reading
details and gallery storage; do not add
an inactive button or imply completed adoption. If a detail adoption action is
included, document its destination, application scope and behavior before
implementation. The prior UX recommendation distinguishes beginning an
application, submitting it and completing adoption; these are separate actions.

## Deferred Scope: Upload Interface

The authorized plan includes backend upload and the visitor gallery, excluding
a volunteer upload UI and live frontend integration. No upload controls are
added to the visitor page. Upload formats/size limits, MinIO read access/URL
lifetime and partial-failure cleanup are fixed in the technical plan before code.

## Acceptance

Acceptance criteria are maintained exclusively in [acceptance.md](acceptance.md).
Implementation of all tasks in [tasks.md](tasks.md) is authorized by the user.
The technical sequence and decisions are in [plan.md](plan.md).
