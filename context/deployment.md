# Deployment

Last updated: 2026-03-08

## AWS S3 Static Website (US-16)
- Infrastructure template: `infra/s3-static-website.yaml`
- Setup script: `scripts/aws/setup-s3-website.sh`
- npm command: `npm run aws:s3:setup`

## AWS S3 Build and Deploy (US-17)
- Deployment script: `scripts/aws/deploy-s3-website.sh`
- npm command: `npm run aws:s3:deploy`
- Deployment flow:
  - Builds production assets with `npm run build`
  - Resolves the bucket from stack `ttt-ms-aj-s3-website` by default
  - Syncs `dist/` to the S3 website bucket with deletion of removed files

### Optional Overrides
- `BUCKET_NAME=ttt-ms-aj-your-unique-site npm run aws:s3:deploy`
- `STACK_NAME=ttt-ms-aj-s3-website-usw2 AWS_REGION=us-west-2 npm run aws:s3:deploy`
- `BUILD_DIR=dist npm run aws:s3:deploy`

## Deployed Resources
- CloudFormation stack: `ttt-ms-aj-s3-website`
- S3 bucket: `ttt-ms-aj-tic-tac-toe-site`
- Region: `us-west-2`
- Website URL: `http://ttt-ms-aj-tic-tac-toe-site.s3-website-us-west-2.amazonaws.com`

## Configuration Notes
- Bucket static website hosting is enabled.
- `index.html` is configured as both index and error document to support SPA route refresh behavior.
- Public access is limited to object reads through bucket policy (`s3:GetObject` on bucket objects).
- Naming guardrails require `ttt-ms-aj` in stack and bucket names.
