**Example output (refactored description)**

# Add Widgets Retrieval Endpoint

## Context
- Widgets are required for the dashboard to render.

## Problem / Goal
- Provide an authenticated endpoint to fetch widgets for a user.

## Proposed Solution (High Level)
- Implement GET /api/widgets that returns widgets for the current user.

## In Scope
- Authenticated fetch
- Sorting by lastUpdated desc

## Out of Scope
- Bulk import/export

## Dependencies
- Auth middleware
- Widgets repository

## Risks / Unknowns
- Cache strategy (TBD). Follow-up spike created.

## Acceptance Criteria
1. Given an authenticated user, when requesting GET /api/widgets, then returns 200 with a list of widgets in schema X.
2. Given an unauthenticated request, when requesting GET /api/widgets, then returns 401.
3. Given an authenticated user with no widgets, when requesting GET /api/widgets, then returns 200 with an empty list.
4. p95 latency ≤ 300ms for payload ≤ 50KB.

## Testing Specs
### Unit Tests
- Auth checks, schema validation, empty list behavior

### Integration Tests
- Repository query + serialization contract

### End-to-End Tests (if applicable)
- Dashboard renders widgets from endpoint

### Test Data / Environments
- Seed at least 0, 1, many widgets

### Observability (logs/metrics/traces)
- Log request id and record latency metric `widgets_get_latency_ms`

## Grooming Notes
### Grooming Session 2026-02-05
- Decisions:
  - Return 200 + empty list when no widgets exist
- Assumptions:
  - Existing auth middleware remains unchanged
- Follow-ups:
  - Spike: evaluate caching strategy
