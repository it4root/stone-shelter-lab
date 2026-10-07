# Add Stone UI with Mock Submission

## Goal and Authorization

Provide a page where a visitor enters stone details, optionally selects photos,
and adds a stone through the UI's mock API boundary. The mock returns a valid
successful creation response. A stone without photos displays the existing
placeholder in the UI.

The user explicitly requested continuous implementation of all remaining tasks
after completion of T0009-001. Commits and pushes
remain unauthorized. Acceptance criteria live exclusively
in [acceptance.md](acceptance.md); implementation work is in [tasks.md](tasks.md)
and technical decisions are in [plan.md](plan.md).

## Relationship to Existing Features

Use the visual language and frontend architecture of
[feature 0005](../0005-ui-mock-to-code/spec.md), the details/gallery behavior of
[feature 0006](../0006-stone-details/spec.md), and the creation/draft DTO shapes
specified by [feature 0008](../0008-add-stone-api/spec.md). This feature brings
the creation page and preliminary gallery into UI scope independently of the
backend implementation. Live HTTP integration remains deferred.

Generated `/v3/api-docs` and `/v3/api-docs.yaml` remain the HTTP contract source of
truth. Verify frontend creation and draft-upload DTOs against the generated
contract before implementing the mock boundary. Do not add handwritten OpenAPI,
backend routes, database changes or MinIO operations.

The interaction choices below make the page usable with the existing mock
catalog and define the authorized implementation.

## Entry and Navigation

Expose an `Add stone` link in the catalog's content toolbar. It opens
`/stones/new`, which must be matched before numeric stone detail routes.
The page heading is `Add a stone`, with a `Back to catalog` link.
Use the existing application Header and Footer and native same-origin link
behavior. Browser back/forward, direct navigation and refresh must recognize
the creation route; modified clicks retain browser defaults.

Returning to the catalog preserves its existing filters, sorting and page size.
The new stone participates in those rules; do not force it into a filtered-out
result or reset the catalog automatically. Refresh the catalog data after
creation so totals and visible matches reflect the mock write.

## Details Form

Use labelled English controls and existing explicit enum presentation mappings.
Start the details area directly with the Name field, without the visible
`Stone details` heading or introductory paragraph. Do not display static helper
text below Name, Stone type, Size or Biography. Keep labels, required markers,
validation and field-associated errors.
The form contains:

| Control | Behavior |
| --- | --- |
| Name | Required nonblank text, at most 120 characters |
| Stone type | Required choice from the ten existing StoneType values, initially unselected |
| Size | Required SMALL, MEDIUM or LARGE choice, initially unselected |
| Biography | Optional text, at most 2048 characters |
| Photos | Optional selection and preliminary gallery as described below |

Create new stones with `adoptionStatus: AVAILABLE`, supplied explicitly in the
request; this is a page choice, not a backend default. There is no admission-date
input or date value in the creation request. The backend assigns the current
UTC instant, as specified in feature 0008. The mock creation adapter mirrors
this server-owned timestamp behavior; the form neither computes nor sends it.
Name duplication is allowed; preserve valid entered name and biography text.

Do not expose the legacy `photo` string as a URL input. Omit it or send null;
selected files are referenced through `photoUploadIds`. No photos means an empty
reference array, not a required photo, placeholder upload or fabricated photo ID.

The primary submit button is `Add stone`. Validate details before invoking the
creation boundary. Show field-associated English errors and focus the first
invalid control. A success-only mock does not bypass frontend input validation.

## Optional Photos and Preliminary Gallery

Accept zero to 16 JPEG, PNG or WebP files, up to 10 MiB each. Allow multiple
selection and later batches up to the total limit. Client checks cover nonempty
files, declared supported media types, per-file size and total count. Actual
server-side content/signature validation belongs to feature 0008 and is not
reimplemented in the browser.

Photo help displays supported formats and count/size limits without the sentence
`You can add more in another selection.`

Validate the entire new batch before starting mock uploads. If it exceeds a
limit or contains invalid input, report the error and retain the previously
accepted selection. Do not silently truncate or partially accept that batch.
Selecting the same file again is allowed if the total remains within the limit;
each accepted upload has its own reference.

Upload accepted files through an asynchronous mock draft-upload operation and
show local image previews. Maintain selection order across batches; the first
remaining photo is the cover. Display the count out of 16 and allow removing an
individual photo before submission. Removal changes the submitted reference
list without creating a stone or calling a backend deletion endpoint.

The creation form uses a fixed 4 × 4 grid of 16 square photo slots in the upper
preview area, replacing the former large cover preview. Accepted photos fill
these slots in selection order; unoccupied slots show a neutral empty
state. Display the gallery here instead of below the file chooser, including
the cover indicator and removal controls within occupied slots. Keep all 16
slots visible on narrow screens with four columns and no horizontal overflow.
Do not display the former 1–16 numbers in empty slots; retain accessible slot
names and the uploaded-photo cover/removal labels.

Without photos, the grid has 16 empty slots and explains that photos are
optional; success, catalog and detail views still use `/placeholder-rock.png`
for photo-free stones. Failed image display in an occupied slot also uses that
existing bitmap unchanged.

During an upload batch, keep detail fields editable, expose an accessible busy
state, and disable creation and further photo selection/removal until the batch
settles. Closing the file picker without choosing files changes nothing. Entered
details survive photo selection and removal; removing all photos restores the
empty 16-slot grid and still permits creation.

Use the draft upload response shape (`id`, `url`, `uploadedAt`, `expiresAt`). The
mock preview URL refers to locally read bytes, not MinIO; timestamps represent
the existing 24-hour contract. This iteration does not simulate expiration,
signed URL refresh, copying failures or background cleanup.

## Submission and Success

Send current valid details and the ordered successful draft UUIDs through
`createStone`. Upload bytes are sent only to the draft mock boundary; creation
sends the JSON-shaped request with references and does not reread/reupload them.
An accepted creation call always resolves with a valid StoneCreateResponse;
there are no configured random or simulated API failures.

While creation is pending, expose `Adding stone…`, disable form editing and
repeat submission, and accept at most one creation call. On success, remain on
the page and replace the editable form with an accessible confirmation:

`Stone added successfully.`

Show the created name and ID, a preview using the returned cover or the default
placeholder, and links `View stone` and `Back to catalog`. Provide an
`Add another stone` action that starts a fresh empty-name form with
no selected type/size, no photos and the empty 16-slot grid. The previous submit
action is no longer available in the success state.

Mock-created stones are available through the existing catalog and detail API
boundaries for the current browser runtime. Their photo order, cover and enum
values agree with the creation response. With no photos, `photos` is empty and
the absent cover is rendered using the existing UI placeholder. Mock reads apply
the existing reservation overlay to newly created stones as well.

Use a generated numeric stone ID that cannot collide with initial fixtures or
earlier creations. Do not mutate the original 30 stone fixtures or photo fixtures.
Runtime additions are lost on a full reload; do not persist uploaded files or
created stones in localStorage, IndexedDB or a real database. Revisiting the
creation route starts a fresh form; unsaved-form restoration is not required.

## Layout and Accessibility

Follow the existing light background, green accents, typography, rounded controls
and spacing. On desktop, present the gallery and form together; stack them on
narrow screens. The page must fit a 320-pixel viewport without horizontal overflow
and allow ordinary vertical scrolling. Use visible focus states, semantic form
controls, a named main region and a focusable page heading on navigation.
Associate errors, required-field information and photo help with their controls;
announce upload/submit progress and creation success. Removal controls identify
the corresponding photo for keyboard and screen-reader users. Respect reduced
motion preferences and preserve existing catalog/detail/reservation navigation.

## Implementation Constraints

Follow the constitution, root/frontend AGENTS.md and ADR-0005. Keep feature
components, hooks and validation under `src/features/add-stone`; API DTOs and
boundaries under `src/api`; runtime mock adapters under `src/mocks`. Components
never import fixtures directly. App composes pages; Common components do not own
creation state. Reuse existing enums, labels, styles and test dependencies.

## Out of Scope

- Live UI/backend HTTP calls, real PostgreSQL or MinIO writes.
- Accounts, authentication, roles and restricted admin navigation.
- Stone editing/deletion, adoption status controls or publication workflows.
- Photo reordering, cropping, compression and drag-and-drop upload.
- Mock storage expiration, replication, repair and support alerts.
- Persistence across reloads and unsaved-form confirmation/restoration.
- Random mock API failures or a development-only failure toggle.
- New dependencies, generated images, automatic seeding and unrelated UI changes.
