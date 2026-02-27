# Terraform: S3 + CloudFront Baseline

This module provisions a private S3 bucket fronted by CloudFront using OAC. It also uploads a placeholder `index.html` for validation.

## Prereqs
- Terraform installed
- AWS credentials/profile configured with permissions to create S3, CloudFront, IAM policy on bucket

## Usage
```bash
cd infra/terraform
terraform init
terraform plan -out plan.tfplan
terraform apply plan.tfplan
```

## Validate
```bash
# CloudFront URL is output after apply
curl -i "$(terraform output -raw cloudfront_url)"

# Direct S3 access should be denied
# Replace with your bucket name
curl -i "https://<bucket>.s3.amazonaws.com/index.html"
```

## Inputs
- `aws_region` (string, default `us-west-2`)
- `project_name` (string, default `ttt`)
- `bucket_name` (string, optional) — if omitted, a unique name is generated
- `cloudfront_cache_policy_id` (string, default AWS managed `CachingOptimized`)
- `tags` (map(string), optional)

## Outputs
- `bucket_name`
- `cloudfront_url`
- `cloudfront_distribution_id`
