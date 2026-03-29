variable "resource_namespace" {
  description = "Shared account namespace prepended to resource names to avoid collisions."
  type        = string
  default     = "jltlnd"
}

variable "project_name" {
  description = "Logical project name used for tagging and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment name such as dev, staging, or prod."
  type        = string
}

variable "aws_region" {
  description = "AWS region for the stack. CloudFront remains global."
  type        = string
  default     = "us-west-2"
}

variable "frontend_bucket_force_destroy" {
  description = "Whether the frontend bucket may be force-destroyed when tearing down non-production environments."
  type        = bool
  default     = false
}

variable "price_class" {
  description = "CloudFront price class for the frontend distribution."
  type        = string
  default     = "PriceClass_100"
}

variable "domain_aliases" {
  description = "Optional custom domain names for CloudFront."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "Optional ACM certificate ARN in us-east-1 for custom domains."
  type        = string
  default     = null
}

variable "route53_zone_id" {
  description = "Optional Route53 hosted zone ID used when creating alias records."
  type        = string
  default     = null
}

variable "create_route53_records" {
  description = "Whether Terraform should create Route53 alias records for domain aliases."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags to apply to all supported resources."
  type        = map(string)
  default     = {}
}

variable "backend_lambda_memory_size" {
  description = "Memory size for backend Lambda functions."
  type        = number
  default     = 256
}

variable "backend_lambda_timeout_seconds" {
  description = "Timeout for backend Lambda functions."
  type        = number
  default     = 10
}
