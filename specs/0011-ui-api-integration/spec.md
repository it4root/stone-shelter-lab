# Feature 0011: UI and Backend Integration with Optional Mocks

## Goal and Authorization

Migrate every existing UI data operation to the real backend while retaining an
explicit standalone mock launch and deterministic mock-based UI tests. The user
authorized documentation followed by continuous execution of all tasks. No
commits or pushes are authorized.

Acceptance criteria live exclusively in [acceptance.md](acceptance.md), technical
decisions in [plan.md](plan.md), and execution items in [tasks.md](tasks.md).

## Launch and Data Boundary

The ordinary development launch and production build use the API. Provide explicit
API and mock development commands and an optional mock build. Select one adapter
at the API boundary; components must never import fixtures. All public operations,
including reads, return promises in both modes. Mock mode needs neither backend
nor MinIO and retains in-memory additions, photos and reservations until reload.
Ordinary UI tests explicitly select mocks independently of the normal API default.
API failures must never switch the application to mock data.

Backend addresses come from environment configuration. Development and preview
may proxy same-origin `/api` and backend `/images` requests to an explicitly
configured backend target. Production requires equivalent reverse proxy routing
or a configured API base URL with backend CORS supplied by its operator. Keep
credentials server-side; browser-visible photo URLs remain backend-owned.

For local delivery, an already running backend image that predates the required
operations must be rebuilt from the current source. Preserve existing Compose
volumes and environment values, supply missing documented photo settings,
and configure the local UI proxy. Do not seed the real database. This local
development refresh is separate from isolated verification and remote deployment.

## HTTP Contract Requirements

Generated `/v3/api-docs` and `/v3/api-docs.yaml` remain the only HTTP contract
source of truth. Reuse the existing operations without new endpoints or schemas:

| UI operation | Existing HTTP operation |
| --- | --- |
| Catalog, filters, sorting and pagination | POST `/api/v1/stones/search`, JSON containing filter, page, size and sort |
| Details and ordered gallery | GET `/api/v1/stones/{id}` |
| Preliminary photo upload | POST `/api/v1/stone-photo-drafts`, multipart field `file` |
| Stone creation | POST `/api/v1/stones`, details and ordered photoUploadIds |
| Adoption application | POST `/api/v1/stones/{id}/reservations`, applicantName and contactDetails |

Read successes use 200 and creation/upload/reservation successes use 201. Preserve
dedicated DTO fields, enum values, RFC 9457 ProblemDetail failures, gallery order,
server-owned admissionDate, photo limits, and catalog response metadata. Do not
send file bytes, client dates or placeholder URLs in creation JSON. Browser fetch
sets the multipart boundary; do not set a JSON Content-Type for FormData.

The existing backend search is AVAILABLE-only. Bring mocks into parity: apply
availability before filters, counts and pagination; RESERVED/ADOPTED filters
produce zero matches, while direct details still display those stones. After
reservation refresh details and catalog without resetting session choices. If a
write removes the last result from the current page, load the last valid page.

## Reads, Pending State and Failures

Catalog and details expose accessible loading, error and manual retry states.
An empty catalog is shown only after a successful empty response. Invalid local
detail IDs and HTTP 404 show Stone not found; network, malformed-response and
other HTTP failures show a recoverable load error instead. Ignore obsolete read
results after parameter changes or unmount. Preserve catalog filters, sort,
size, sidebar and navigation behavior from feature 0010.

Keep existing details visible during reservation readback so the same adoption
modal can retain its confirmation. Distinguish failed refresh from success and
allow a manual reload. Normalize network and non-ProblemDetail failures to
English errors; preserve HTTP status and usable ProblemDetail detail/title.

## Writes and Photos

Keep existing pending guards and success UX. A failed creation retains details
and successful photo references, unlocks the form, announces the failure, and
allows manual resubmission without automatic writes or reuploads. A failed
reservation retains applicant fields; 404/409 block repeat submission as before.
Refresh displayed availability after success; do not infer success on failure.

Settle each selected photo batch, retain successful uploads in selection order,
report failures and retain previous selections and entered details. Previously
successful uploads must not be resent automatically. Rejected references can be
removed and replacement photos selected. Removing a photo remains local; no
draft deletion endpoint or automatic preview renewal is introduced.

## Scope and Relationship to Earlier Features

This ticket supersedes the mock-only/synchronous-data restrictions in features
0005, 0006, 0007, 0009 and 0010 and mock search visibility where it differed from
the generated backend contract. Preserve their page design, routes, form rules,
gallery, validation and navigation. Existing assertions change only for the
documented asynchronous boundary and AVAILABLE-only catalog semantics.

Exclude new CRUD screens, authentication, admin roles, deployment, automatic real
database seeding, Kafka, schema/migration changes, photo editing, automatic write
retries and additional business functionality. Reuse existing dependencies and
pinned versions. Verify actual API integration on isolated infrastructure and
clean up test-created data; do not populate the user's database.
