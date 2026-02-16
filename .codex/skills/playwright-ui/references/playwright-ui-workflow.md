# Playwright UI Workflow Reference

## Targeting
- Single file: `npx playwright test tests/example.spec.ts`
- Name grep: `npx playwright test -g "login error"`
- Project: `npx playwright test --project=chromium`

## Debugging Modes
- UI mode: `npx playwright test --ui`
- Inspector: `npx playwright test --debug`
- Headed: `npx playwright test --headed`
- Trace capture: `npx playwright test --trace=on`

## Stable Locator Patterns
- Prefer `page.getByRole("button", { name: "Save" })`.
- Prefer `page.getByLabel("Email")` for form controls.
- Prefer `page.getByTestId("...")` when role/name is ambiguous.
- Avoid brittle deep CSS/XPath selectors.

## Assertion Patterns
- Visibility: `await expect(locator).toBeVisible()`
- Enabled state: `await expect(locator).toBeEnabled()`
- URL changes: `await expect(page).toHaveURL(/.../)`
- Network-backed state: assert on visible state change, not fixed delays.

## Flake Checklist
1. Is state shared across tests?
2. Is the locator tied to dynamic text or animation?
3. Is the test waiting on UI state instead of sleep?
4. Is data deterministic for this scenario?
5. Is environment-specific behavior gated (local vs CI)?

## CI Reliability
- Run retries in CI, not locally by default.
- Keep test timeouts explicit and modest.
- Save traces for failures and inspect before patching.
- Gate merges on targeted suite plus smoke/full suite as needed.

