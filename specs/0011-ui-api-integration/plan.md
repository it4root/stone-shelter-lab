# Feature 0011: Technical Plan

## Adapter and Configuration

Use native fetch and FormData, existing DTOs, Vite modes and environment loading.
Add a shared HTTP client/error type under src/api and an HTTP stone adapter.
stonesApi selects API by default and lazy-loads the existing mock adapter for
mock mode. Adapt mock reads at this boundary without moving types into mocks.
Provide dev:api, dev:mock and build:mock scripts. `.env.example` documents
API_PROXY_TARGET and optional VITE_API_BASE_URL. Proxy /api and /images in both
development and preview; do not add backend CORS or a deployment system.

## Feature State

Use effect-owned asynchronous catalog/detail reads, keyed by their parameters
and a refresh revision. Cleanup invalidates obsolete completions. Keep current
details mounted during refresh to preserve the reservation modal. Read errors
are recoverable and separate from successful empty/not-found responses.
Correct out-of-range pages after a refreshed total shrinks.

Existing creation and reservation hooks keep duplicate-write guards. Catch
creation failures, expose errors and retain form state. Settle photo uploads with
Promise.allSettled and append only successful results in input order. Match mock
search availability to the actual backend restriction. Refresh catalog after
creation/reservation and on catalog return without resetting session settings.

## Verification

Use existing Vitest/Testing Library and deterministic mock adapters. Update
existing tests to await async reads, preserving their behavioral assertions.
Add focused HTTP-boundary, stale-read, failure/retry and partial-upload checks.
Inspect newly generated OpenAPI JSON/YAML and run backend verification using
PostgreSQL/MinIO Testcontainers. Verify real transport against an isolated backend
and Vite proxy with test-created resources, then delete those resources and stop
only infrastructure started by verification. Leave the ordinary UI server running.
Refresh an outdated local Compose API from current source without replacing its
volumes or existing settings; add only missing documented local configuration.
Verify health and the current routes through the ordinary UI proxy using reads.
Do not add dependencies, migrations, commits or pushes.
