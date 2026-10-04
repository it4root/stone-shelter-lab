# Stone Catalog

## Goal

Provide a basic catalog of stones available in Stone Shelter.

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
Default sort is by name ascending, with id ascending as a tiebreaker.
Sorting is allowed by name and size only, ascending or descending
Filters combine with AND. No matches is an empty page, not an error.
Malformed input returns 400 as RFC 9457 ProblemDetail.
A missing stone returns 404 as RFC 9457 ProblemDetail.
The list defaults to page 0, page size 12, maximum page size 24
Allow exactly one sort criterion per request. Multiple sort criteria are not supported and should return 400. For equal values of the selected sort field, always use id ASC as the deterministic tie-breaker.
Use one `filter` query object containing page, size, stoneType, stoneSize,
adoptionStatus, sortBy and sortDirection, serialized as `filter[property]=value`.
Its separate sorting properties are `sortBy` (name or stoneSize, default name)
and `sortDirection` (asc or desc, default asc). Repeated sorting properties return 400.
Photo is an optional string of at most 500 characters reserved for future
functionality. An empty string becomes null; no URL validation or whitespace
trimming is required at this stage.
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