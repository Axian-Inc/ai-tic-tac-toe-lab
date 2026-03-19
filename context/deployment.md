# Deployment

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
