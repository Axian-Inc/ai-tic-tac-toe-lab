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
