provider "aws" {
  region = var.aws_region
}

data "aws_region" "current" {}

locals {
  allowed_workspace = "stanb"
}

resource "terraform_data" "workspace_guard" {
  input = terraform.workspace

  lifecycle {
    precondition {
      condition     = terraform.workspace == local.allowed_workspace
      error_message = "This configuration must be run from the 'stanb' workspace. The default workspace is not allowed."
    }
  }
}

resource "aws_s3_bucket" "site" {
  bucket = var.bucket_name
  tags   = var.tags

  depends_on = [terraform_data.workspace_guard]
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

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "site_public_read" {
  statement {
    sid    = "PublicReadGetObject"
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.site.arn}/*",
    ]
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_public_read.json

  depends_on = [aws_s3_bucket_public_access_block.site]
}
