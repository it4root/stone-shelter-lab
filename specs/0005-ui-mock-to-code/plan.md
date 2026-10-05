# Implementation Plan

Use the existing React, TypeScript and Vite stack without additional dependencies.

## Data

Use the generated YAML snapshot `engineering-log/openapi.yml`, specifically
`StoneSearchResponse`, as the reference for local mock entries. Keep 30 entries
as a local collection rather than an API-shaped page exceeding the backend page
size limit. No network requests or mock HTTP server are needed.
Use the contract enum values for stone types, sizes and adoption statuses.
Store the supplied placeholder under the UI public directory.

## Presentation

Build a static header and a responsive catalog grid with CSS. Render all local
entries. Reserve desktop side space for future filters and chat; reclaim that
space on small screens. Use the provided image as the visual reference.
Clamp biographies to two lines. Keep excluded controls out of the UI.

## Verification

Run lint, Vitest and production build after each implementation task. Verify
catalog content and missing-photo fallback with component tests when rendering
is implemented. Check representative desktop, tablet and mobile widths visually
in the final verification task.
