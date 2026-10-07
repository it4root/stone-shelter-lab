# Acceptance Criteria: Feature 0007

Status: Implementation and automated verification completed on 2026-10-07.
Native browser responsive/keyboard verification remains pending because the
current computer-use session exposes no browser surfaces. Evidence below
distinguishes executed checks from this outstanding verification.

## Details Action and Modal

| ID | Given / When | Expected result |
| --- | --- | --- |
| AC-01 | A known `AVAILABLE` stone's details are opened | An enabled `Adopt this stone` button appears in the stone information block before characteristics, following the feature 0006 mock; Header and Footer retain existing behavior. |
| AC-02 | Details belong to a `RESERVED` or `ADOPTED` stone | The adoption button is disabled; current status remains visible and no reservation form can be opened through it. |
| AC-03 | The action is activated by mouse, touch or keyboard | A named accessible modal opens for that exact stone; opening alone creates no reservation and changes no status. |
| AC-04 | A form is opened after catalog filtering/sorting/pagination, or from a direct detail URL | Its read-only summary shows the selected stone's actual name and id, with its photo beside them and both applicant fields below. |
| AC-05 | A stone has multiple, one or zero gallery photos, or its photo fails | The modal uses the first gallery image, otherwise legacy cover, otherwise the existing placeholder; changing the detail gallery preview does not alter this default. Broken images fall back without endless retries. |
| AC-06 | Modal is used at desktop/tablet/mobile widths, including 320 pixels, with long content | Summary and fields remain readable; narrow layouts may stack the summary, keep fields below and allow vertical scrolling without horizontal page/modal overflow. |
| AC-07 | Keyboard navigation and screen-reader semantics are inspected | Dialog has an accessible name; fields have labels; focus enters and stays within the open modal; background is inert with scroll locked; controls show focus. Close control and Escape dismiss it and restore focus to the action, or its action area if success disabled the button. |
| AC-08 | An unsubmitted modal is closed, or a different stone's form is opened | Closing creates no reservation; the other stone has its own summary and no carried-over applicant values or success state. |

## Validation, Submission and Feedback

| ID | Given / When | Expected result |
| --- | --- | --- |
| AC-09 | Either `Your name` or `Contact details` is empty or whitespace-only and submission is attempted | The UI shows an associated English field error and makes no reservation call; the other field's value is retained. |
| AC-10 | Both fields contain nonblank arbitrary text, including Unicode names and contacts without phone/email syntax | Input passes basic validation; entered text is preserved, with no phone/email pattern or business length constraint. |
| AC-11 | Valid form is submitted and the API boundary is still pending | Only selected stone id, applicantName and contactDetails are supplied; pending state is exposed and repeated activation cannot issue a second submission. |
| AC-12 | Submission succeeds | The same modal stays open, replaces the form with a green checkmark and exactly `Application submitted. Please wait for us to contact you.`; success is accessible beyond color/icon alone and no redirect occurs. |
| AC-13 | Successful modal is dismissed and details/catalog are revisited in the current mock runtime | Details show `Reserved`, another reservation is disabled, and subsequent detail/catalog reads agree on `RESERVED`; status never becomes `ADOPTED` through this flow. |
| AC-14 | A retryable submission failure occurs before any successful reservation | The modal stays open, retains both field values, shows an accessible English error without success confirmation and allows another attempt. A later successful retry follows AC-12/AC-13. |
| AC-15 | Availability changes or the stone disappears after the form opens | Data-source checks reject the stale submission; UI shows an unavailable/conflict/not-found error without creating another reservation or displaying success. Retry cannot override eligibility. |

## Backend Contract and Persistence

| ID | Given / When | Expected result |
| --- | --- | --- |
| AC-16 | Valid JSON is posted to `/api/v1/stones/{id}/reservations` for an `AVAILABLE` stone without a reservation | HTTP 201 returns StoneReservationCreateResponse with generated id, matching stoneId, adoptionStatus `RESERVED` and server-assigned UTC createdAt; no Location header. |
| AC-17 | The successful transaction is inspected and the stone is read/searched | Exactly one reservation stores applicant name, contacts, creation time and stone association by id; stone status is `RESERVED`. No stone name/photo snapshot or applicant data appears in stone read/search DTOs. |
| AC-18 | Each required request field is omitted, null, empty or whitespace-only, one at a time; or body is absent/malformed or path id is malformed | HTTP 400 ProblemDetail; no reservation is created and no stone status changes. |
| AC-19 | Valid nonblank arbitrary text is submitted to the backend | It is accepted without phone/email syntax validation or business length limits and stored without rewriting valid text. |
| AC-20 | A valid request targets an unknown stone id | HTTP 404 ProblemDetail and no reservation record. |
| AC-21 | A valid request targets a `RESERVED` or `ADOPTED` stone | HTTP 409 ProblemDetail; no new reservation and no status change. |
| AC-22 | Another reservation already exists for the same stone id, using identical or different applicant data | HTTP 409 ProblemDetail; the original reservation is unchanged and no second record is created. This also holds if catalog maintenance previously reset the status to `AVAILABLE`. |
| AC-23 | Two or more valid requests concurrently reserve the same initially `AVAILABLE` stone | Exactly one returns 201; the others return 409; one reservation exists and the stone is `RESERVED`, without unexpected 500 responses. |
| AC-24 | Valid reservations are submitted for different available stones | Each can succeed independently; uniqueness is per stone, not per applicant name or contact details. |
| AC-25 | Persistence fails during reservation creation/status change | The transaction rolls back both effects, returns standard 500 ProblemDetail and leaves the stone available without a reservation; a later valid retry can succeed. |
| AC-26 | Backend restarts against the same database after a successful reservation | Reservation and `RESERVED` status survive; a repeat request still returns 409. |
| AC-27 | Existing stone DELETE is used on a reserved stone | Existing identifier-only HTTP 200 response is preserved; the dependent reservation is removed, no orphan remains, and existing gallery/deferred cleanup behavior is preserved. |
| AC-28 | Database structure and migration history are inspected | New Liquibase migration adds generated reservation id, non-null unique stone foreign key, non-null text fields and creation timestamp; applied migrations remain unchanged. |
| AC-29 | `/v3/api-docs` and `/v3/api-docs.yaml` are generated | Both describe the new POST, JSON request, required string fields, dedicated four-field response and 201. Existing operations and ADR-0004 success-only documentation settings remain intact; no handwritten contract is introduced. |
| AC-30 | Failure responses from AC-18/20/21/22/25 are inspected | They use RFC 9457 ProblemDetail with application/problem+json, type, title, status and detail; business services remain independent of HTTP error types. |

## Mock Boundary, Regression and Verification

| ID | Given / When | Expected result |
| --- | --- | --- |
| AC-31 | UI runs without backend, PostgreSQL or MinIO | Full modal/reservation flow works on the same 30 mock identities through src/api; no live HTTP integration is needed. |
| AC-32 | Mock reservation operations and subsequent reads are inspected | Availability, duplicates and runtime status changes are handled in the adapter; imported fixtures are unchanged, API DTOs stay outside mocks and components do not import fixtures. Reload may restore initial fixtures. |
| AC-33 | Automated UI checks run with controlled pending/failure/conflict outcomes | Validation, duplicate-click prevention, retry, success and stale-state behavior are reproducible without visitor-facing simulation controls or persistent browser storage. |
| AC-34 | Catalog/detail/gallery regressions and source layout are checked | Navigation/history, retained catalog parameters/scroll, gallery ordering/selection and fallbacks keep feature 0006 behavior. Feature components/hooks, API types and mocks follow existing responsibility boundaries. |
| AC-35 | Implementation verification is completed | Backend `./mvnw verify` passes on pinned JDK with PostgreSQL Testcontainers behavior/transaction/concurrency/generated-contract/architecture checks. Frontend lint, test run and production build pass; responsive, keyboard and modal checks are recorded and the local UI is left running with its URL reported. |

## Verification Evidence

| Criteria | Result and executed evidence |
| --- | --- |
| AC-01–AC-05, AC-08–AC-15 | Automated checks passed. Action/modal and integrated page tests cover eligibility, exact stone summary, first/legacy/missing/broken photo paths, independent form state, blank input, arbitrary Unicode text, pending duplicate submissions, same-modal confirmation, manual retry, conflicts and status readback across navigation. The action is before characteristics in the page information block. |
| AC-06 | Pending native browser verification. Responsive CSS supports 320 pixels, wrapped identity text, bounded modal height and internal vertical scrolling; actual viewport measurements/screenshots have not been obtained. |
| AC-07 | Automated checks passed for dialog/labels, focus containment/restoration, Escape, inert background, scroll locking and post-success focus. Native keyboard/browser confirmation remains pending. |
| AC-16–AC-25, AC-27–AC-30 | Passed. Full Maven verify on JDK 23.0.2 ran 178 tests with zero failures/errors/skips, including 16 reservation HTTP cases, six service/mapper cases, two persistence cases, generated JSON/YAML and architecture checks. Real PostgreSQL tests cover six concurrent HTTP attempts (one 201, five 409), per-stone uniqueness, atomic rollback after flush, unchanged arbitrary text, required input and dependent deletion. Existing catalog/photo/cleanup tests also passed. |
| AC-26 | Passed. Compose API restart smoke checked the persisted reservation id, stone association, applicant name, contact text, timestamp and RESERVED status against PostgreSQL, then verified duplicate 409. Disposable stones and dependent reservation rows were removed. |
| AC-31–AC-34 | Passed by automated tests and source review. All 30 mock identities remain; runtime overlays preserve fixtures, reads agree on RESERVED and the flow stays behind src/api without live HTTP. Existing history/catalog state/gallery tests pass. New source types are under their module roots and included in compilation/build. |
| AC-35 | Automated/build/runtime portions passed; native browser portion pending. Frontend lint, 68 tests in 10 files and production build passed on Node 24.21.0/npm 11.19.0. UI is running at http://127.0.0.1:5174/; Compose API/PostgreSQL/MinIO are healthy. |

Generated OpenAPI is served by the running backend at `/v3/api-docs` and
`/v3/api-docs.yaml`; no handwritten contract, dependency/version changes or
applied-migration edits were introduced. The shared error handler explicitly
serializes ProblemDetail type as about:blank under Spring 7.

Computer-use discovery returned no apps/browsers; attempts to use Chrome and the
in-app browser reported unavailable, and the final inventory remained empty.
No native browser visual/keyboard pass is claimed. T0007-007 remains open solely
for that check; implementation tasks T0007-001 through T0007-006 are complete.
Local commits were subsequently authorized; no push is authorized. Unrelated
engineering notes are excluded from feature commits.
