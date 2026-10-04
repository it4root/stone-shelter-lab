# 001 — Acceptance criteria

Format: Given / When / Then. Every criterion has a stable ID.
IDs are never renumbered. Removed criteria stay as strikethrough with a note.

Coverage: `auto` = covered by an integration test tagged with the same ID,
`manual` = checked by hand in the browser or curl, `none` = not covered yet.

## Create

| ID | Given                      | When                                              | Then                                                               | Coverage |
|---|----------------------------|---------------------------------------------------|--------------------------------------------------------------------|---|
| AC-1 | a valid create request     | it is posted to `/api/v1/stones`                  | 201, `Location` header, body equals the created stone with an `id` | none |
| AC-2 | a valid create request     | `name` is `""` or whitespace only                 | 400, `application/problem+json`                                    | none |
| AC-3 | a valid create request     | `stoneType` is `GRANITE_X`                        | 400, `problem+json`                                                | none |
| AC-4 | a valid create request     | `stoneSize` is `HUGE`                             | 400, `problem+json`                                                | none |
| AC-5 | a valid create request     | `adoptionStatus` is `GONE`                        | 400, `problem+json`                                                | none |
| AC-6 | a valid create request     | `name` is longer than the max                     | 400, `problem+json`                                                | none |
| AC-7 | a valid create request     | `biography` is longer than the max                | 400, `problem+json`                                                | none |
| AC-8 | a valid create request     | `photo` is absent                                 | 201, body has `photo: null`                                        | none |
| AC-9 | a valid create request     | `adoptionStatus` is absent                        | 400 — status is required, not defaulted                            | none |
| AC-10 | a valid create request     | two stones with the same name created suceesfully | 201, `Location` header, body equals the created stone with an `id`                                          | none |

## Read one

| ID | Given | When | Then | Coverage |
|---|---|---|---|---|
| AC-11 | stone `7` exists | `GET /api/v1/stones/7` | 200, response conforms to the Stone schema in the OpenAPI contract| none |
| AC-12 | no stone `999999` | `GET /api/v1/stones/999999` | 404, `problem+json` | none |
| AC-13 | — | `GET /api/v1/stones/abc` | 400, `problem+json` | none |

## List, paging

| ID | Given | When | Then | Coverage |
|---|---|---|---|----------|
| AC-14 | 15 stones exist | `GET /api/v1/stones` | 200, `size` is 12, `page` is 0, `content` has 12 items | none |
| AC-15 | 15 stones exist | `GET /api/v1/stones?filter[page]=1` | 200, `content` has 3 items, `totalElements` is 15 | none |
| AC-16 | 15 stones exist | `GET /api/v1/stones?filter[page]=99` | 200, `content: []`, `totalElements` is 15 — not 404 | none |
| AC-17 | 15 stones exist | `GET ?filter[page]=-1` / `?filter[size]=0` / `?filter[size]=25` / `?filter[size]=13` | 400, 400, 400, 200 | none |
| AC-18 | 15 stones exist | `GET /api/v1/stones?filter[size]=24` | 200, `content` has 15 items | none |
| AC-19 | 15 stones exist | `GET /api/v1/stones` | body has exactly `content`, `page`, `size`, `totalElements` — no `pageable`, `sort`, `first`, `last`, `empty` | none |
| AC-20 | 15 stones exist | the same paged request twice | identical `content` order both times | none |

## List, filters

| ID | Given | When | Then | Coverage |
|---|---|---|---|---|
| AC-21 | stones of several stone types exist | `?filter[stoneType]=GRANITE` | 200, only granite stones | none |
| AC-22 | stones of several sizes exist | `?filter[stoneSize]=SMALL` | 200, only small stones | none |
| AC-23 | stones of several statuses exist | `?filter[adoptionStatus]=RESERVED` | 200, only reserved stones | none |
| AC-24 | stones match one filter but not another | `?filter[stoneType]=GRANITE&filter[stoneSize]=SMALL` | 200, only stones matching both — AND, not OR | none |
| AC-25 | no stone matches | `?filter[stoneType]=SLATE&filter[stoneSize]=SMALL` | 200, `content: []` — not 404, not 400 | none |
| AC-26 | — | `?filter[stoneType]=GRANITE_X` / `?filter[stoneSize]=HUGE` / `?filter[adoptionStatus]=GONE` | 400 each, `problem+json` | none |
| AC-27 | stones named `granite` and `GRANITE` exist | `?filter[stoneType]=granite` | 400 — filter values are case-sensitive enum names | none |
| AC-28 | stones exist | `?filter[stoneType]=GRANITE&filter[page]=0&filter[size]=5` | 200, `size` is 5, `totalElements` counts filtered total, not all stones | none |

## List, sorting

| ID | Given | When | Then | Coverage |
|---|---|---|---|---|
| AC-29 | stones `BETA`, `ALPHA`, `GAMMA` exist | `GET /api/v1/stones` | order is ALPHA, BETA, GAMMA | none |
| AC-30 | two stones share a name | any list request | relative order of the two is stable across repeated requests | none |
| AC-31 | stones `BETA`, `ALPHA`, `GAMMA` exist | `?filter[sortBy]=name&filter[sortDirection]=desc` | order is GAMMA, BETA, ALPHA | none |
| AC-32 | one stone of each size exists | `?filter[sortBy]=stoneSize&filter[sortDirection]=asc` | SMALL, then MEDIUM, then LARGE — domain order, not alphabetical | none |
| AC-33 | one stone of each size exists | `?filter[sortBy]=stoneSize&filter[sortDirection]=desc` | LARGE, then MEDIUM, then SMALL | none |
| AC-34 | — | `?filter[sortBy]=biography&filter[sortDirection]=asc` | 400, `problem+json` — whitelist enforced | none |
| AC-35 | — | `?filter[sortBy]=name&filter[sortBy]=stoneSize` or `?filter[sortBy]=name,stoneSize` or `?filter[sortDirection]=asc&filter[sortDirection]=desc` | 400, `application/problem+json` — multiple sort criteria are rejected | none |
| AC-36 | stones exist | `?filter[stoneType]=GRANITE&filter[sortBy]=stoneSize&filter[sortDirection]=desc` | both apply: filtered, and sorted by size | none |


## Update

| ID | Given | When | Then | Coverage |
|---|---|---|---|---|
| AC-37 | stone `7` exists | `PUT /api/v1/stones/7` with a valid body | 200, body is the updated stone | none |
| AC-38 | no stone `999999` | `PUT /api/v1/stones/999999` with a valid body | 404, `problem+json` | none |
| AC-39 | stone `7` has a biography | `PUT` without `biography` | 200, `biography` is now `null` — PUT is full replacement | none |
| AC-40 | stone `7` exists | `PUT` with an unknown `stoneType` | 400, and stone `7` is unchanged | none |

## Delete

| ID | Given | When | Then | Coverage |
|---|---|---|---|---|
| AC-41 | stone `7` exists | `DELETE /api/v1/stones/7` | 204, no body | none |
| AC-42 | stone `7` was deleted | `GET /api/v1/stones/7` | 404 | none |
| AC-43 | no stone `999999` | `DELETE /api/v1/stones/999999` | 404, `problem+json` | none |
| AC-44 | stone `7` was deleted | a new stone is created with the same name and attributes | 201, and it is a different id from `7` | none |

## Errors, cross-cutting

| ID | Given | When | Then | Coverage |
|---|---|---|---|---|
| AC-45 | any request above fails | the response is inspected | `Content-Type` is `application/problem+json`, body has `type`, `title`, `status`, `detail` | none |
| AC-46 | any endpoint | it is called with no credentials | it responds normally — v1 has no authentication | none |

## Additional validation and catalog guarantees

| ID | Given | When | Then | Coverage |
|---|---|---|---|---|
| AC-47 | an otherwise valid create request | each required input field (`name`, `stoneType`, `stoneSize`, `adoptionStatus`, `admissionDate`) is omitted or set to `null`, one at a time | 400, `application/problem+json`; no Stone is created | none |
| AC-48 | an existing Stone and an otherwise valid replacement request | each required input field (`name`, `stoneType`, `stoneSize`, `adoptionStatus`, `admissionDate`) is omitted or set to `null`, one at a time | 400, `application/problem+json`; the existing Stone is unchanged | none |
| AC-49 | malformed JSON with `Content-Type: application/json` | it is posted to `/api/v1/stones` or sent with PUT to an existing Stone | 400, `application/problem+json`; no Stone is created and the existing Stone is unchanged | none |
| AC-50 | the catalog contains no Stones | `GET /api/v1/stones` | 200, `content: []`, `page: 0`, `size: 12`, `totalElements: 0` | none |
| AC-51 | an existing Stone has a photo | a valid full replacement PUT omits `photo` or sets it to `null` | 200, response has `photo: null`; a subsequent GET also returns `photo: null` | none |
| AC-52 | two valid create requests have the same name | both are posted to `/api/v1/stones` | both return 201 with distinct IDs; each Location identifies its own Stone, and both Stones can be retrieved | none |
| AC-53 | two Stones have the same name | the catalog is requested with default sorting, `filter[sortBy]=name&filter[sortDirection]=asc`, or `filter[sortBy]=name&filter[sortDirection]=desc` | Stones with equal names are ordered by `id ASC` in every case | none |
| AC-54 | two Stones have the same size | the catalog is requested with `filter[sortBy]=stoneSize&filter[sortDirection]=asc` or `filter[sortBy]=stoneSize&filter[sortDirection]=desc` | Stones with equal sizes are ordered by `id ASC` in both cases | none |
| AC-55 | an otherwise valid create request has an `admissionDate` later than the current instant, including later on the same day | it is posted to `/api/v1/stones` | 400, `application/problem+json`; no Stone is created | none |
| AC-56 | an existing Stone and an otherwise valid replacement request with an `admissionDate` later than the current instant, including later on the same day | the replacement is sent with PUT | 400, `application/problem+json`; the existing Stone is unchanged | none |
| AC-57 | Stones with different names exist | the catalog is requested with `?filter[sortBy]=name` and `?filter[sortBy]=name&filter[sortDirection]=asc` | both return 200 with identical content order, using name ASC and id ASC as the tiebreaker | none |
| AC-58 | — | `?filter[sortBy]=name&filter[sortDirection]=sideways` or `?filter[sortBy]=&filter[sortDirection]=asc` | 400 each, `application/problem+json` — invalid direction or missing sort field | none |

## Timestamp, normalization, length limits and development seed

| ID | Given | When | Then | Coverage |
|---|---|---|---|---|
| AC-59 | an otherwise valid request | POST or PUT to an existing Stone contains a malformed `admissionDate`, such as `not-a-timestamp` or `2026-02-30T08:00:00Z` | 400, `application/problem+json`; no Stone is created and the existing Stone is unchanged | none |
| AC-60 | an otherwise valid request | POST or PUT to an existing Stone contains `admissionDate: "2026-10-01T08:00:00"` without an offset | 400, `application/problem+json`; no Stone is created and the existing Stone is unchanged | none |
| AC-61 | an otherwise valid request with `photo: ""` | it is posted to `/api/v1/stones` or sent with PUT to an existing Stone | 201 for POST or 200 for PUT, response has `photo: null`; subsequent GET also returns `photo: null` | none |
| AC-62 | otherwise valid requests with ASCII `name` values of 120 and 121 characters | each is sent with POST and with PUT to an existing Stone | 120 characters is accepted with 201 or 200; 121 returns 400, `application/problem+json`, without creating or changing a Stone | none |
| AC-63 | otherwise valid requests with ASCII `biography` values of 2048 and 2049 characters | each is sent with POST and with PUT to an existing Stone | 2048 characters is accepted with 201 or 200; 2049 returns 400, `application/problem+json`, without creating or changing a Stone | none |
| AC-64 | otherwise valid requests with ASCII `photo` values of 500 and 501 characters | each is sent with POST and with PUT to an existing Stone | 500 characters is accepted with 201 or 200 without URL validation; 501 returns 400, `application/problem+json`, without creating or changing a Stone | none |
| AC-65 | a fresh database with no Stones and the Spring `dev` profile explicitly enabled | the application starts and Liquibase completes | exactly 50 seed Stones exist, covering all 10 Stone types, all 3 sizes and all 3 adoption statuses | none |
| AC-66 | a fresh database with no Stones and the Spring `dev` profile not enabled | the application starts and Liquibase completes | no development seed Stones are inserted | none |
| AC-67 | the development seed has been applied and the 50 Stones are unchanged | the application restarts against the same database with the Spring `dev` profile enabled | there are still exactly 50 Stones with the same IDs and attributes; no duplicate seed rows are inserted | none |
