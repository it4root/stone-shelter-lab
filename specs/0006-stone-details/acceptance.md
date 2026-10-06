# Acceptance Criteria: Feature 0006

Status: Implemented and verified on 2026-10-06. All criteria below passed.
Detail adoption and the volunteer upload UI are deferred by the authorized plan.

1. Clicking a catalog photo or its placeholder opens `/stones/{id}` for that
   exact stone after filtering, sorting or pagination. The link is accessible
   by keyboard, has an identifying accessible name and visible focus.
2. The details page works without a running backend, reusing the same 30 mock
   stones through the API boundary. Components do not import mock fixtures.
3. The page shows the selected stone's photo/fallback, name, actual id, explicit
   English type/size/status labels and readable UTC admission date. Values agree
   with its contract-compatible detail data; no unsupported properties appear.
4. The complete biography is readable without two-line truncation. Supplied
   paragraph/line breaks are preserved; missing biography has the English fallback.
5. The gallery shows one large selected image and its thumbnail carousel below.
   First added is selected initially and supplies the catalog cover. Selecting
   another thumbnail changes the preview only; revisiting restores the first photo.
6. Direct entry/refresh for a known id works independently of current catalog
   filters/page. Unknown ids and malformed detail URLs show Stone not found with
   a usable Back to catalog link, without substituting another stone.
7. Browser Back/Forward and Back to catalog work. Returning from details retains
   catalog filters, sorting, page/size, sidebar state and scroll position within
   the same session. Direct visits without previous state use catalog defaults.
8. Desktop follows the mockup's image-left/information-right direction. Tablet
   and mobile remain readable at representative widths including 320 pixels,
   with no horizontal overflow and the documented stacked content order.
9. The shared Header and Footer retain existing behavior. Header has no favorites,
   counts or added action buttons. Photo hearts, found-in-nature badge, unsupported
   characteristics, chatbot launcher and excluded adoption functionality are absent.
10. Existing catalog rendering, pagination (default 8; choices 8/12/24), sorting
    and filters retain their behavior. The new route does not add working header
    navigation or change any stone's adoption status.
11. Frontend lint, meaningful navigation/detail/fallback/regression tests and
    production build pass. Responsive and keyboard checks are recorded; the
    local UI is left running after frontend verification unless requested otherwise.
12. Generated OpenAPI describes the extended detail photos array, read-side cover
    projection and multipart upload endpoint. Existing stone/search routes,
    pagination and legacy create/update photo inputs retain documented compatibility.
13. Galleries preserve successful addition order after later uploads, refresh and
    backend restart. Equal timestamps/concurrent additions do not create unstable
    order or duplicate positions. Later uploads do not replace the first cover.
14. Thumbnail selection works by mouse, touch and keyboard with visible focus and
    selected state. Overflow scrolls within the strip; navigation respects bounds,
    no automatic advance occurs and the page has no horizontal overflow.
15. Zero photos use legacy photo or placeholder without fabricated thumbnails;
    one photo has no unnecessary navigation. Broken main/thumbnail images use
    placeholder, preserve order and allow other images to be selected.
16. Uploading a valid image to a known stone returns 201 and its dedicated photo
    response; bytes are retrievable from MinIO and metadata belongs to that stone.
    Unknown stones, invalid input, configured format/size violations and storage
    failure produce specified ProblemDetail responses without visible orphan entries.
    JPEG/PNG/WebP up to 10 MiB are accepted; corrupt data is 400, unsupported or
    mismatched media type is 415, oversized upload is 413.
17. MinIO stores image bytes; the database stores metadata/object references and
    stable positions through new Liquibase changesets. Applied changesets remain
    unchanged. Secrets are environment-only; read URLs work in the browser and
    temporary URLs are not persisted as canonical object references.
18. Compose includes pinned MinIO configuration and persistent storage. Backend
    PostgreSQL/MinIO integration and generated-contract tests verify upload/read,
    ordering, legacy fallback, failure behavior and cleanup on stone removal.
19. Mock UI uses placeholder-rock.png for all gallery images and covers
    zero/one/multiple-photo galleries for the same catalog dataset
    without requiring a backend or MinIO. No unapproved volunteer upload UI,
    photo deletion/reordering/main-photo editing or live frontend integration appears.
20. Backend verification passes for storage/contract/schema changes; frontend
    lint/tests/build and responsive/gallery interaction checks pass.
    Verification evidence is recorded after implementation below.


## Verification Evidence

| Criteria | Result and evidence |
| --- | --- |
| 1–4, 6–7, 9–10 | Passed. Frontend tests cover exact-id lookup, nullable fields/full biography, UTC labels, accessible links, unknown routes, browser history and retained catalog state. Chrome Back/Forward and explicit back preserved two size filters, OLDEST sort, page 2, closed sidebar and scrollY 200. |
| 5, 8, 14–15, 19 | Passed. Placeholder-only galleries cover zero/one/six images for the same 30 identities. Tests cover selection, first cover, broken images and resize. Chrome checks at 1440/1024/768/390/320 pixels showed no page overflow; keyboard Enter selected the focused thumbnail, overflow controls scrolled, and refresh restored the first photo. |
| 11, 20 | Passed. Frontend lint, 46 tests in 7 files and production build passed. Full Maven verify on JDK 23.0.2 passed 145 tests with zero failures/errors/skips. The UI remains running at http://localhost:5174/ using Node 24.21.0; detail route returns 200. |
| 12 | Passed. Five generated OpenAPI tests verify JSON/YAML schemas, ordered photos, multipart endpoint/errors and existing routes. The running Compose API serves the expanded generated contract. |
| 13, 16 | Passed. Twelve real PostgreSQL/MinIO gallery tests cover valid JPEG/PNG/WebP and retrieved bytes, input/size/type failures, storage failure, 12 concurrent uploads, equal timestamps and first-cover semantics. A Compose smoke check uploaded two placeholder images; ids, positions, timestamps and bytes survived restarting both API and MinIO. |
| 17–18 | Passed. New Liquibase tables validate against PostgreSQL, with unchanged existing migrations. Compose MinIO uses the checksum-verified pinned binary and a persistent volume; all three services are healthy. Direct unsigned reads return 403; signed reads return the uploaded bytes. Failure tests cover metadata compensation, deferred retry, attached-object protection and cleanup errors after committed deletion. Deleting the smoke-check stone returned 200 and both managed objects returned 404. |

Decision records are in [ADR-0006](../../docs/adr/0006-stone-details.md),
with stack pins in [ADR-0001](../../docs/adr/0001-stack-versions.md).
Task records are in [tasks.md](tasks.md). Temporary smoke-test data was removed.
The UI remains mock-first; real upload/storage was verified independently.
