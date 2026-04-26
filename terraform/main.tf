provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

locals {
  workspace_slug = replace(lower(terraform.workspace), "/[^a-z0-9-]/", "-")
  project_slug   = replace(lower(var.project_name), "/[^a-z0-9-]/", "-")
  site_bucket    = var.bucket_name != "" ? var.bucket_name : "${local.project_slug}-${local.workspace_slug}-${data.aws_caller_identity.current.account_id}"

  common_tags = {
    Project     = var.project_name
    Environment = terraform.workspace
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket" "site" {
  bucket = local.site_bucket

  tags = merge(local.common_tags, {
    Name = local.site_bucket
  })
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

data "aws_iam_policy_document" "site_public_read" {
  statement {
    sid = "AllowPublicRead"

    actions = [
      "s3:GetObject",
    ]

    resources = [
      "${aws_s3_bucket.site.arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "site_public_read" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_public_read.json

  depends_on = [
    aws_s3_bucket_public_access_block.site,
  ]
}
