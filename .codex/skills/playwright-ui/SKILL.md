---
name: playwright-ui
description: Build, debug, and stabilize Playwright UI tests for web apps. Use when creating new UI E2E tests, fixing flaky selectors/assertions, collecting traces/screenshots/videos, or running Playwright in headed/UI/debug modes.
---

# Playwright UI

## Quick Start
- Read `references/playwright-ui-workflow.md`.
- Use `scripts/run_playwright_ui.sh` for common run modes.
- Prefer stable selectors: `getByRole`, `getByLabel`, `getByTestId`.

## Workflow
1. Reproduce the issue with a narrow target (single spec or grep).
2. Stabilize selectors and assertions before adding waits.
3. Add deterministic setup/teardown and test data.
4. Re-run in `--headed` or `--debug` mode for timing/visibility issues.
5. Capture traces on retry/failure and use trace viewer to find root cause.
6. Keep fixes minimal, then expand to a broader suite run.

## Test Authoring Rules
- Write user-observable assertions, not implementation-detail assertions.
- Scope locators to accessible roles and names where possible.
- Avoid hard sleeps; use Playwright auto-waiting and explicit `expect(...)`.
- Keep each test focused on one business scenario.
- Isolate state (new context/session or deterministic reset).

## Flake Triage Rules
- Classify first: selector drift, timing, state leakage, network dependency, env variance.
- Fix root cause before increasing timeout.
- If timeout changes are necessary, keep them local and document why.
- Verify with repeated runs of the affected spec before full-suite run.

## Commands
- `scripts/run_playwright_ui.sh test -- <path-or-grep-args>`
- `scripts/run_playwright_ui.sh ui -- <path-or-grep-args>`
- `scripts/run_playwright_ui.sh headed -- <path-or-grep-args>`
- `scripts/run_playwright_ui.sh debug -- <path-or-grep-args>`
- `scripts/run_playwright_ui.sh trace -- <path-or-grep-args>`
- `scripts/run_playwright_ui.sh report`

