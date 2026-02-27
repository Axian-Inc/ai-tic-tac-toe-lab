variable "aws_region" {
  type        = string
  description = "AWS region for S3 and CloudFront resources."
  default     = "us-west-2"
}

variable "project_name" {
  type        = string
  description = "Short project identifier used for naming."
  default     = "ttt"
}

variable "bucket_name" {
  type        = string
  description = "Optional explicit bucket name. If empty, a unique name is generated."
  default     = ""
}

variable "tags" {
  type        = map(string)
  description = "Optional tags to apply to resources."
  default     = {}
}

variable "cloudfront_cache_policy_id" {
  type        = string
  description = "CloudFront cache policy ID. Defaults to AWS managed CachingOptimized."
  default     = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}
