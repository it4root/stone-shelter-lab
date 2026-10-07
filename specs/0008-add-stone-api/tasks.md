# Add Stone API — Tasks

Specification: [spec.md](spec.md). Acceptance criteria:
[acceptance.md](acceptance.md). Technical plan: [plan.md](plan.md).

Implementation of all listed tasks has now been explicitly requested. Execute
only the requested task or tasks. Do not
create commits or push without explicit authorization. If a commit is authorized,
use the `0008-add-stone-api:` prefix and the complete task ID.

Each task includes its relevant verification and a one-line completion report.
Acceptance criteria are referenced here, never redefined.
The user's requested server-owned creation date authorizes T0008-009 as a
backend dependency of the current 0009 UI revision. Commits remain unauthorized.

- [x] **T0008-001 — Record the technical implementation plan.**
  - Populate plan.md with the entity/DTO/service boundaries, transactional
    association and concurrent cleanup approach, post-commit single-attempt
    copying, placeholder serving, configuration, migration compatibility, and
    operator-run HTTP loader design.
  - Keep the numeric stone ID and record the separate storage UUID design.
  - Reuse current pinned dependencies and identify the existing permanent bucket
    configuration and the new draft bucket configuration.
  - Verification: review plan links and coverage against the specification and
    all acceptance IDs; confirm no application or UI code was changed.
  - Dependencies: none.
  - Verification: plan/specification links and acceptance coverage reviewed;
    git diff --check passes for the feature documents; no source/UI changes.

- [x] **T0008-002 — Add persistence and two-bucket storage foundations.**
  - Add new Liquibase changesets for draft photo records, stone storage UUIDs,
    photo copy readiness/source references, and bucket-aware cleanup work.
  - Define entities, responsibility-based packages, and repositories with the
    locking/query operations required by association and cleanup.
  - Extend MinIO configuration/storage operations for distinct draft and permanent
    buckets, actual object copying, and bucket-specific reads/removals.
  - Update environment examples and local infrastructure configuration without
    changing pinned versions or moving existing permanent objects.
  - Verify migrations on PostgreSQL, existing-data compatibility, bucket isolation,
    actual copies and byte preservation, and architecture constraints.
  - Acceptance references: AC-0008-020, AC-0008-026, AC-0008-032.
  - Dependencies: T0008-001.
  - Verification: JDK 23.0.2; migration and real two-bucket copy/isolation tests
    pass; existing photo integration, cleanup job and architecture checks pass.

- [x] **T0008-003 — Implement draft upload and preview HTTP endpoints.**
  - Add dedicated shared Request/Response DTOs, thin controllers, services, and
    correctly named entity/DTO mappers.
  - Reuse existing image validation; persist successful uploads and their 24-hour
    expiration, and provide refreshable private preview URLs.
  - Handle failed/interrupted uploads with durable cleanup work and translate
    protocol-independent exceptions in the existing HTTP handler.
  - Annotate controllers/DTOs for generated OpenAPI; add HTTP/storage/failure tests.
  - Acceptance references: AC-0008-001 through AC-0008-010, AC-0008-027.
  - Dependencies: T0008-002.
  - Verification: draft upload/preview tests cover supported formats, size/errors,
    refresh, exact expiry and storage/persistence failure; photo regressions and
    architecture pass on JDK 23.0.2 with PostgreSQL/MinIO Testcontainers.

- [x] **T0008-004 — Create stones using existing draft references.**
  - Extend StoneCreateRequest with ordered photoUploadIds and apply input limits.
  - Validate complete reference sets and transactionally create the stone and
    gallery associations; prevent concurrent double consumption.
  - Extend response mapping with the managed gallery and preserve legacy requests.
  - Add a backend-served copy of the existing placeholder asset for gallery
    entries that are not ready in permanent storage.
  - Keep successful association independent of copying; before T0008-005, newly
    associated pending entries can use the placeholder.
  - Verify creation, retry after rejection, list/order/expiry validation, rollback,
    concurrent association, legacy behavior, DTO mapping, and generated schemas.
  - Acceptance references: AC-0008-011 through AC-0008-019, AC-0008-025,
    AC-0008-027; relevant creation/read parts of AC-0008-024 and AC-0008-034.
  - Dependencies: T0008-003.
  - Verification: 16-photo ordered creation, rejection/retry, rollback, concurrent
    consumption, placeholder, legacy catalog, mapper, architecture and generated
    OpenAPI checks pass on JDK 23.0.2.

- [x] **T0008-005 — Copy accepted photos and project permanent galleries.**
  - Attempt copying only after the stone transaction commits, using the stable
    stone UUID prefix and unique photo keys in the permanent bucket.
  - Record per-photo readiness; enqueue redundant draft cleanup after confirmed
    copies. Keep failed-copy sources associated and protected.
  - Preserve successful creation when copies fail; project permanent URLs or the
    placeholder consistently in creation, detail, and catalog DTOs.
  - Do not introduce replication workers, repeated copy attempts, alerts, or UI
    changes. Verify full and partial copy failures and original byte preservation.
  - Acceptance references: AC-0008-020 through AC-0008-026, AC-0008-029,
    AC-0008-030.
  - Dependencies: T0008-004.
  - Verification: real copies/byte preservation, post-commit timing, partial/full
    storage failures, readiness rollback, placeholder projections, existing
    append-photo regressions and architecture checks pass.

- [x] **T0008-006 — Extend scheduled cleanup and stone deletion.**
  - Reuse the existing bounded cleanup orchestration for expired unassociated
    drafts, redundant confirmed sources, interrupted uploads, and deleted stones.
  - Coordinate cleanup with association, retain sources after failed copies,
    distinguish bucket/key pairs, and preserve durable work on failures/restarts.
  - Verify expiration boundaries, actual deletion, protected sources, races,
    dependency failures, cleanup limits, and existing deletion behavior.
  - Acceptance references: AC-0008-006, AC-0008-027 through AC-0008-033.
  - Dependencies: T0008-005.
  - Verification: exact expiry, real cleanup, protected failed-copy sources,
    redundant-source deletion, creation/cleanup concurrency, both-bucket stone
    deletion, failure retention and shared job budgets pass with regressions.

- [x] **T0008-007 — Provide the explicit HTTP test-data loader.**
  - Add a command-line mechanism and usage documentation for a caller-supplied
    backend URL, using only the documented draft and stone creation routes.
  - Select numbered tiles from the supplied type folders, validate inputs before
    mutations, generate valid English stone details, and report created IDs.
  - Report reusable draft IDs if creation fails; stop on API errors without
    unbounded retries or silently skipped photographs.
  - Verify HTTP calls and failure behavior, then exercise the supplied dataset
    against isolated running PostgreSQL/MinIO test infrastructure.
  - Do not execute the loader against a real database unless separately requested.
  - Acceptance references: AC-0008-035 through AC-0008-039.
  - Dependencies: T0008-006.
  - Verification: four Python HTTP/input/failure tests pass; the full loader
    creates 10 stones and 124 photos through a real isolated backend, and all
    permanent photo bytes match the supplied tiles in numeric order.

- [x] **T0008-008 — Verify the complete feature and generated contract.**
  - Run ./mvnw verify on the pinned JDK, including existing catalog, reservation,
    photo, mapper, and architecture regression checks.
  - Check generated OpenAPI JSON/YAML for draft routes and the extended creation
    contract; verify the placeholder and loader end-to-end behavior.
  - Check implementation against every criterion in acceptance.md and record
    actual results, remaining limitations, and verification commands.
  - Confirm UI implementation, replication/repair, support workflows, automatic
    seeding, and unauthorized commits/pushes were not introduced.
  - Acceptance references: AC-0008-001 through AC-0008-039.
  - Dependencies: T0008-007.
  - Verification: final ./mvnw -q verify passes on JDK 23.0.2: 208 tests,
    zero failures/errors/skips; four standalone Python loader tests pass.
    All AC-0008-001 through AC-0008-039 reviewed with evidence in acceptance.md.
    Existing-schema upgrade, generated JSON/YAML equivalence, real loader data,
    and exact preview expiry are covered. git diff --check passes; no dependency,
    applied-migration or UI changes, automatic real-data seeding, commits or pushes.

- [x] **T0008-009 — Assign admission timestamps on the backend at creation.**
  - Remove the creation request date and its mapper input; assign the UTC Clock
    instant in the creation service before persistence.
  - Align generated contract descriptions and loader requests; preserve update
    validation, historical data, catalog ordering/filtering and photo lifecycle.
  - Verify controlled-clock creation/readback with zero/photos, ignored obsolete
    input, generated JSON/YAML, loader and full backend regressions on pinned JDK.
  - Acceptance references: AC-0008-019, AC-0008-024, AC-0008-034,
    AC-0008-036 and AC-0008-040.
  - Dependencies: T0008-008.
  - Verification: ./mvnw -q verify passed on JDK 23.0.2, with 205 tests and
    zero failures/errors/skips; all 95 catalog cases additionally passed after
    a concurrent targeted run overwrote that class's report. Generated current
    JSON/YAML agree and omit the creation request date; four Python loader
    tests pass. Controlled-clock tests cover no photos, 16 photos, obsolete
    input and persistence/create/detail/search agreement. No migrations,
    dependencies, real-data population, commits or pushes were introduced.
