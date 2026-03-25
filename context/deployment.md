# Deployment

## File Index

This file documents deployment-related commands and constraints.
It covers the local build and preview commands for the app.
It records where Terraform infrastructure lives.
It states the required Terraform workspace for infrastructure work.
It lists the script-based deployment and hosting validation commands.

## Content

Date: 2026-03-19

Notes:
- Vite build via `npm run build`.
- Preview via `npm run preview`.
- Infrastructure is defined in `/terraform`.
- Select or create the `stanb` workspace before planning or applying Terraform.
- The Terraform configuration intentionally fails in the `default` workspace.
- Deploy the built site with `npm run deploy:s3`.
- Validate the hosted site with `npm run deploy:validate`.
- Run `npm run deploy` to build, sync `dist/` to S3, and verify the website URL serves HTML.
- Production CORS policy for the multiplayer server should be updated in `server/index.js` via `setCorsHeaders` to allow only the deployed frontend origin(s) instead of `*`.
