# Quickstart

Browser-based Tic Tac Toe built with React, TypeScript, Vite, Vitest, Playwright, and an AWS deployment path managed with Terraform. The frontend supports local single-player play, and the repo also includes a multiplayer backend plus infrastructure for AWS hosting.

For the full project overview, architecture, and setup details, see [README.md](README.md) and [Historical Context](../context/README.md).

## Setup

Install dependencies:

```bash
npm install
```

Install Playwright browsers for end-to-end tests:

```bash
npm run test:e2e:install
```

More detail: [Install Dependencies](README.md#install-dependencies)

## Run

Start the local dev server:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Build the backend:

```bash
npm run build:backend
```

Preview the production frontend build:

```bash
npm run preview
```

More detail: [Run Locally](README.md#run-locally)

## Test

Run frontend unit tests:

```bash
npm test
```

Run backend tests:

```bash
npm run test:backend
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Run the combined frontend unit plus end-to-end flow:

```bash
npm run test:all
```

More detail: [Run Tests](README.md#run-tests), [Pull Request Checks](README.md#pull-request-checks), and [Testing Guide](testing.md)

## Coverage

Generate frontend coverage:

```bash
npm run coverage:frontend
```

Generate backend coverage:

```bash
npm run coverage:backend
```

Generate both:

```bash
npm run coverage
```

More detail: [Coverage Reports](README.md#coverage-reports)

## Deploy

Provision AWS infrastructure:

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform workspace new jlt
terraform workspace select jlt
terraform plan
terraform apply
```

Build and publish the app after Terraform apply:

```bash
export VITE_MULTIPLAYER_API_BASE_URL="$(terraform output -raw backend_http_api_url)"
export VITE_MULTIPLAYER_WS_URL="$(terraform output -raw backend_websocket_api_url)"
export FRONTEND_BUCKET_NAME="$(terraform output -raw frontend_bucket_name)"
export FRONTEND_DISTRIBUTION_ID="$(terraform output -raw frontend_distribution_id)"

cd ../../
npm run build:backend
VITE_MULTIPLAYER_API_BASE_URL="$VITE_MULTIPLAYER_API_BASE_URL" \
VITE_MULTIPLAYER_WS_URL="$VITE_MULTIPLAYER_WS_URL" \
  npm run build
aws s3 sync dist "s3://$FRONTEND_BUCKET_NAME" --delete
aws cloudfront create-invalidation --distribution-id "$FRONTEND_DISTRIBUTION_ID" --paths "/*"
```

More detail: [Deployment Overview For AWS](README.md#deployment-overview-for-aws), [Terraform Usage Overview](README.md#terraform-usage-overview), and [Deployment Operations](deployment-operations.md)
