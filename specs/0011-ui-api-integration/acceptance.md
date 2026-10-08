# Feature 0011: Acceptance Criteria

Criteria are defined exclusively here. Automated and real HTTP verification
passed on 2026-10-08; browser rendering was unavailable as recorded below.

| ID | Given / When | Expected result | Verification |
| --- | --- | --- | --- |
| AC-0011-001 | Ordinary/API launch and build | API is selected, configured addresses are used and no mock fallback occurs | Configuration tests, builds and server checks |
| AC-0011-002 | Explicit mock launch/build or ordinary UI tests | Mocks work without backend/MinIO; runtime writes and reload reset remain; tests explicitly use mocks | Mock regressions, configuration and launch checks |
| AC-0011-003 | Each existing UI data operation runs in API mode | Correct route, verb, JSON/multipart payload and contract-shaped responses are used; reads return promises in both modes | HTTP adapter tests and isolated real API smoke |
| AC-0011-004 | Generated backend contract is inspected | DTOs, enums, success statuses, optional fields, server date and photo references agree; no handwritten contract or backend behavior change | Current generated JSON/YAML review |
| AC-0011-005 | Catalog search loads, fails, retries or returns zero rows | Accessible pending/error/retry and successful empty states are distinct; totals/page/size use server metadata | Controlled-promise interaction tests |
| AC-0011-006 | Catalog controls change or older reads settle late | Requests reflect filters/sort/page/size; obsolete results do not replace current data; session choices survive navigation | Race and existing application tests |
| AC-0011-007 | Details load, fail, return 404 or receive an invalid local ID | Correct stone/gallery appears; loading and retryable failures differ from Stone not found; no obsolete stone is shown | Detail interaction and race tests |
| AC-0011-008 | An AVAILABLE stone is reserved | Same modal shows success; details become RESERVED, catalog excludes it and totals refresh; choices remain, an empty last page is corrected | Reservation/application tests and real API smoke |
| AC-0011-009 | Mock catalog reads with availability/status constraints | AVAILABLE-only matching/counts/paging agree with backend; RESERVED/ADOPTED remain directly readable | Mock boundary tests |
| AC-0011-010 | Creation fails and is manually retried | Error is announced, details/references remain, controls unlock, no success is claimed and no photo reupload or automatic write retry occurs | Creation failure interaction tests |
| AC-0011-011 | A mixed-success photo batch settles | Successful previews/references remain in selection order, prior selections/details survive, failures are announced and controls unlock | Deferred upload interaction tests |
| AC-0011-012 | HTTP ProblemDetail, non-JSON or network failures occur | Status and useful ProblemDetail text are preserved; a readable fallback exists; reservation 404/409 remains blocked | HTTP and write regression tests |
| AC-0011-013 | A stone is created with zero/photos and read/reserved through the UI transport | Backend persists details/gallery/server date; photos are readable, reservation changes status and catalog visibility; isolated data is cleaned up | Real HTTP through Vite proxy and API adapter |
| AC-0011-014 | Completed ticket is verified | Pinned-runtime lint, full UI tests, API/mock builds, generated-contract/backend checks and diff checks pass; README covers both modes and production routing; local UI remains running | Recorded commands and source review |
| AC-0011-015 | An outdated local API image is already running | Current API is rebuilt, health/current contract and UI proxy work, existing volumes/settings are preserved and no real data is seeded | Local startup and read-only HTTP checks |

## Evidence Policy

Keep automated, real HTTP and browser rendering evidence distinct. Use controlled
promises for races and pending states. Reset mock state and fetch/environment
stubs per test. Do not claim real browser behavior from jsdom or HTTP responses.
Record unavailable checks and remaining limitations honestly.

## Delivery Evidence — 2026-10-08

T0011-001 through T0011-006 were executed continuously as authorized. Final
frontend verification used Node 24.21.0 and npm 11.19.0:

- `npm run lint`: passed with zero warnings/errors.
- `npm run test -- --run`: 145 tests in 17 files passed, no failures or skips.
- `npm run build:mock`: TypeScript and Vite mock build passed.
- `npm run build`: TypeScript and Vite API build passed; this is the final dist
  artifact, with no mock adapter/data chunk.

The suite retains the original UI assertions with awaited reads. Availability
expectations changed only for the documented AVAILABLE-only backend semantics;
the focused sorting fixtures now supply their required adoptionStatus. Test
setup explicitly selects mocks, resets runtime data per case, and loads adapters
lazily so file-specific fixture mocks remain effective. Four concurrent Vitest
workers avoid the resource contention observed during the first full run.

Backend verification on JDK 23.0.2 used:

```sh
JAVA_HOME=/usr/local/Cellar/openjdk/23.0.2/libexec/openjdk.jdk/Contents/Home ./mvnw -q verify
```

Result: 213 tests, zero failures/errors/skips, including seven generated-contract
tests and 21 architecture tests. Database/storage verification used PostgreSQL
18.6 and the pinned MinIO release through Testcontainers. Fresh generated JSON
and YAML were captured from the current isolated backend. All 11 frontend DTO
property sets and the three domain enum sets match the generated schemas; create
requests omit admissionDate and include photoUploadIds. No handwritten HTTP
contract, backend source change, migration file or dependency was introduced.

The real transport command `API_PROXY_TARGET=<isolated-backend> npm run test:api`
passed against the current Spring application with isolated PostgreSQL/MinIO
Testcontainers. It executed the actual stonesApi/http client through a temporary
Vite API proxy, not a substitute HTTP implementation. Two test-created stones
covered zero-photo creation and two-photo creation; uploaded previews/permanent
read URLs returned the exact fixture bytes in order. Creation/detail timestamps
agreed, reservation changed details to RESERVED and reduced catalog totals,
RESERVED search returned zero, duplicate reservation returned 409 and a corrupt
upload returned 400. Development SPA entry routes and production-preview
`/api`/`/images` proxy checks also passed. Both stones were deleted and all
isolated storage/database containers were stopped. The smoke helper uses Vite's
supported preview close method after consuming response bodies.

| Criteria | Passing evidence |
| --- | --- |
| AC-0011-001–AC-0011-004 | HTTP/configuration tests, API/mock builds, launch checks, actual adapter smoke and current generated-contract comparison |
| AC-0011-005–AC-0011-006 | Catalog pending/failure/manual retry/empty tests, obsolete-filter-response test, response metadata and existing filter/sort/page/navigation regressions |
| AC-0011-007 | Detail pending/error/retry/missing and obsolete-ID/failure tests; current detail/gallery and route regressions |
| AC-0011-008–AC-0011-009 | Same-modal reservation readback, catalog count/visibility refresh, empty-last-page correction and mock direct-read/status/search checks; real reservation smoke |
| AC-0011-010–AC-0011-011 | Failed creation preserves details/references, manual retry sends the same request with one upload; deferred mixed photo batch retains prior/successful images in selection order and unlocks controls |
| AC-0011-012 | ProblemDetail status/detail/title, non-JSON/network/malformed DTO tests; existing reservation 404/409 blocking and applicant-field retention tests |
| AC-0011-013 | Actual HTTP adapter/Vite proxy, exact MinIO bytes, backend readback/server date/reservation and isolated cleanup |
| AC-0011-014 | Final pinned-runtime checks, current generated contract/backend verification, both READMEs, correct source roots and running UI modes |
| AC-0011-015 | Refreshed local API reports UP and current draft/server-date schemas; ordinary UI proxy search and backend placeholder return 200; existing PostgreSQL/MinIO services and volumes were retained |

## Local Delivery and Limits

The running API image initially exposed an older contract without draft uploads.
Existing `.env` values were preserved; only the missing documented draft-bucket
and placeholder URL settings were added, and ignored `stone-shelter-ui/.env.local`
now configures the proxy. Standard Compose compilation succeeded but Docker
image export failed on a nearly full disk. Only two unused build-cache records
created by this ticket were removed. The already verified current JAR was
packaged with the repository's same pinned JRE/curl runtime and started with
Compose without replacing PostgreSQL/MinIO services or volumes. Read-only checks
confirmed health, current generated schemas and ordinary UI proxy/image access.
No real database seed or test mutation was performed against the local database;
its current catalog has zero stones.

Both UI servers remain running:

- API: `http://127.0.0.1:5174/stone-shelter/catalog`.
- Mocks: `http://127.0.0.1:5175/stone-shelter/catalog`.

Entry documents, placeholder assets, mode configuration and API/image proxy
responses were checked. These HTTP checks and jsdom tests do not prove browser
rendering. Computer-use inventory returned no browsers; opening the in-app
browser returned `Browser is not available`. No visual/browser acceptance pass
is claimed. Existing earlier tickets' pending visual checks remain unchanged.

`git diff --check -- . ':!engineering-log/notes.txt'` passed for this ticket's
changes. A concurrent user edit to engineering-log/notes.txt contains trailing
whitespace and was preserved; repository-wide diff checking reports that
unrelated whitespace. No commits or pushes were created.
