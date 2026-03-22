# Playwright Tests

This folder is the root for Playwright UI and API tests.

## Structure
- `pages/`: Page Object Model (POM) classes for UI interactions.
- `specs/api`: API test specs.
- `specs/ui`: UI test specs.

## Conventions
- Favor `getByRole`, `getByLabel`, and `getByTestId` locators.
- Keep each spec focused on one scenario.
- Use API requests via `request` when testing backend endpoints.

## Reports
- Each Playwright run saves timestamped HTML output under `playwright-report/`.
- UI runs use `playwright-report/ui-<timestamp>-html`.
- API runs use `playwright-report/api-<timestamp>-html`.
- Browser artifacts are saved under `playwright-report/<prefix>-<timestamp>-results`.

Run UI tests
`bash scripts/run_playwright_ui.sh test -- tests/playwright/specs/ui`

Override UI target URL
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 bash scripts/run_playwright_ui.sh test -- tests/playwright/specs/ui`

Run API tests
`bash scripts/run_playwright_api.sh test -- tests/playwright/specs/api`
