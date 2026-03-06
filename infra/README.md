# Infrastructure

## S3 Static Website (US-16)

This directory contains AWS infrastructure for hosting the app as an S3 static website.

### Files
- `s3-static-website.yaml`: CloudFormation template that creates:
  - S3 bucket with static website hosting enabled
  - `index.html` for index and error documents (SPA-friendly refresh behavior)
  - Public-read policy for objects (`s3:GetObject` only)

### Naming Requirement
The bucket name must include `ttt-ms-aj`.

### Deploy
From the project root:

```bash
npm run aws:s3:setup
```

Optional overrides:

```bash
BUCKET_NAME=ttt-ms-aj-your-unique-site STACK_NAME=ttt-ms-aj-s3-website-usw2 AWS_REGION=us-west-2 npm run aws:s3:setup
```
