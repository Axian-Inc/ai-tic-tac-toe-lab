# ai-tic-tac-toe-lab

## App Setup (TTT-13)

Node runtime: use the latest LTS line, `Node.js v24`.

### Local development

```powershell
npm install
npm run dev
```

### Validation commands

```powershell
npm run lint
npm run build
```

The initial app scaffold renders `Coming Soon` as the primary heading.

## Unit Tests

Use the unit test runner helper to compile the TypeScript unit tests and execute them with Node's built-in test runner.

### Run all unit tests

```powershell
bash scripts/run_unit_tests.sh
```

### Run a single unit test file

```powershell
bash scripts/run_unit_tests.sh tests/unit/ttt-65-markSelection.test.ts
```

You can also run the default unit-test script with:

```powershell
npm run test:unit
```

## Tailwind Setup (TTT-14)

Tailwind CSS is configured for the Vite app using the official Vite plugin.

- Installed packages: `tailwindcss`, `@tailwindcss/vite`
- Tailwind is enabled in `vite.config.ts` via the `@tailwindcss/vite` plugin.
- Global styles import Tailwind from `src/index.css` using `@import 'tailwindcss';`.
- Placeholder UI in `src/App.tsx` includes visible Tailwind utility class examples.

No optional Tailwind plugins are configured in this baseline story.

## Playwright Setup (TTT-62 add-on under TTT-14)

Playwright configuration and scaffolding are in place for UI and API testing.

- Config: `playwright.config.ts`
- Test root: `tests/playwright`
- POM base: `tests/playwright/pages/BasePage.ts`
- Runner helper: `scripts/run_playwright_ui.sh`

### Install Playwright (required once)

```powershell
npm install
npx playwright install
```

### Run Playwright

```powershell
npm run test:pw
```

```powershell
scripts/run_playwright_ui.sh ui -- tests/playwright
```

### TypeScript

Playwright tests use a dedicated TS config (`tsconfig.playwright.json`) with Node types enabled.

### Environment Variables

If you prefer using a `.env` file for Playwright, add variables like:

```
TTT11_BASE_URL=https://<cloudfront-url>|https://<bucket>.s3.amazonaws.com/index.html
TTT11_CLOUDFRONT_URL=https://<cloudfront-url>
TTT11_S3_URL=https://<bucket>.s3.amazonaws.com/index.html
```

## Manual Deploy Pipeline (TTT-12)

This repository includes a local deployment script for static assets hosted on S3 + CloudFront.

Script path: `scripts/deploy-static.ps1`

### Prerequisites

- AWS CLI installed and authenticated to the target AWS account/profile.
- Terraform baseline from `TTT-11` applied in `infra/terraform` so outputs are available.
- Build artifacts available in `dist/` (or another directory passed via `-BuildDir`).

### Standard deploy flow (build + upload + invalidation)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1
```

Default behavior:

1. Runs `npm run build`.
2. Resolves `bucket_name`, `cloudfront_distribution_id`, and `cloudfront_url` from Terraform outputs.
3. Runs `aws s3 sync <build-dir> s3://<bucket> --delete`.
4. Runs `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"`.
5. Prints the CloudFront URL for verification.

### Deploy existing artifacts (skip build)

Use this when no app build is present yet, or when artifacts were built earlier.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1 -SkipBuild -BuildDir dist
```

### Optional arguments

- `-AwsProfile <name>`: pass a named AWS CLI profile.
- `-TerraformDir <path>`: directory containing Terraform state (default `infra/terraform`).
- `-BuildDir <path>`: static artifact directory (default `dist`).
- `-BuildCommand <exe,args...>`: override build command (default `npm run build`).
- `-BucketName <name>`: override Terraform output lookup.
- `-DistributionId <id>`: override Terraform output lookup.
- `-CloudFrontUrl <url>`: override Terraform output lookup.
- `-DryRun`: dry-run `s3 sync`; skips invalidation.

### Verification

After deployment, verify the CloudFront URL returns updated content:

```powershell
curl -i https://<cloudfront-url>
```

## Codex Setup

### Atlassian MCP Server

The `.codex/config.toml` defines the Atlassian MCP server which allows working directly with Jira.

To authenticate the MCP server run `codex mcp login atlassian` from within the dev container.

This opens a web authentication flow with Jira and allows MCP server access to your Jira instance.

### Atlassian Story Groomer Skill

This skill allows consistent grooming and story formatting. It still needs work.
