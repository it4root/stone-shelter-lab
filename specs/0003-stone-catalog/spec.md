# Stone Catalog

## Goal

Provide a basic catalog of stones available in Stone Shelter.

Acceptance criteria are defined exclusively in [acceptance.md](acceptance.md).

## Stone attributes
*-required mark is not part of code or naming

A stone has:

- id *
- name *
- photo
- Stone type *
- biography 
- adoption status *
- admission date *
- size *

## Fixed stone types

- BASALT
- GRANITE
- OBSIDIAN
- PUMICE
- LIMESTONE
- SANDSTONE
- SHALE
- MARBLE
- GNEISS
- SLATE

## Fixed stone adoption statuses

- AVAILABLE
- RESERVED
- ADOPTED

## Fixed stone sizes

- SMALL
- MEDIUM
- LARGE

## Capabilities

The system must support:

- create Stone;
- edit Stone;
- delete Stone;
- paginated Stone catalog;
- filter by Stone type;
- filter by size;
- filter by adoption status;
- sort by name;
- sort by size.


## Functional requirements
Catalog search always restricts results to adoptionStatus AVAILABLE. RESERVED
and ADOPTED stones are excluded before sorting, pagination and totalElements
counting, including when filters are omitted, empty or null. The optional
adoptionStatus filter remains supported and combines with this restriction
using AND; requesting RESERVED or ADOPTED returns HTTP 200 with an empty page
and totalElements 0. Callers cannot override catalog visibility with a filter.
After a successful reservation, the stone no longer appears in catalog search.
Direct lookup by id and existing creation/update/reservation operations retain
their behavior; this revision introduces no role-specific search endpoint.
Document this behavior in generated OpenAPI through controllers/shared DTOs;
do not add a handwritten HTTP contract.

Default sort is by admissionDate descending (later admission dates first),
with id ascending as a tiebreaker. This uses the client-supplied admissionDate,
not a separate creation timestamp. If sort or sort.field is omitted or null,
use admissionDate; its omitted direction defaults to desc. An explicitly supplied
direction is respected. Explicit name and stoneSize sorts default to asc when
direction is omitted. Explicit selectable sort fields remain name and stoneSize.
Explicit sort fields are limited to name and size, ascending or descending.
Filters combine with AND. No matches is an empty page, not an error.
Malformed input returns 400 as RFC 9457 ProblemDetail.
A missing stone returns 404 as RFC 9457 ProblemDetail.
A null entity passed to a response mapper is an internal mapping contract failure
and returns HTTP 500 as standard ProblemDetail, not a missing-resource 404.
Use standard ProblemDetail without custom problem type URNs. The default
about:blank type may be omitted from the JSON response.
The list defaults to page 0, page size 12, maximum page size 24
Allow exactly one sort criterion per request. Multiple sort criteria are not supported and should return 400. For equal values of the selected sort field, always use id ASC as the deterministic tie-breaker.
Search uses POST `/api/v1/stones/search` with a JSON body containing optional
`filter`, `page`, `size` and one `sort` object (`field`, `direction`).
Successful deletion returns 200 with the deleted Stone identifier under `id`.
Photo is an optional string of at most 500 characters reserved for future
functionality. Preserve the supplied value unchanged, including null, empty
strings and whitespace. Omitted photo remains null. No photo processing,
normalization, URL validation or whitespace trimming is performed.
Creation returns HTTP 201 with a StoneCreateResponse body and no Location header.
The controller returns the DTO directly and uses @ResponseStatus(HttpStatus.CREATED).
Use `/api/v1/stones` as the collection endpoint
The client supplies `admissionDate` as an ISO-8601/RFC3339 timestamp (example "2026-10-04T08:00:00Z"). Future dates are
invalid
## Out of scope
Deleting a stone is permanent. Soft delete is out of scope.
Visitor, Volunteer permissions and security checks
Photo upload, storage, thumbnails
Authorisation and roles
PATCH is excluded
Multi-sort: rejected; sorting is limited to one field.

## Future evolution
Future features may introduce dynamic Stone types, geological classes,
physical dimensions, behavioral characteristics and AI-assisted classification.
These are not requirements for the current feature.
searchTerm - nullable string for future implementation.
