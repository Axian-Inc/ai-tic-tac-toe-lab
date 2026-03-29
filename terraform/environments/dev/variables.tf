variable "resource_namespace" {
  description = "Shared account namespace prepended to resource names."
  type        = string
  default     = "jltlnd"
}

variable "project_name" {
  description = "Project name for the dev environment."
  type        = string
  default     = "tic-tac-toe-lab"
}

variable "environment" {
  description = "Environment label."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "Primary AWS region for the stack."
  type        = string
  default     = "us-west-2"
}

variable "price_class" {
  description = "CloudFront price class for dev."
  type        = string
  default     = "PriceClass_100"
}

variable "domain_aliases" {
  description = "Optional custom domains for the dev distribution."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "Optional ACM certificate ARN in us-east-1."
  type        = string
  default     = null
}

variable "route53_zone_id" {
  description = "Optional Route53 hosted zone ID for aliases."
  type        = string
  default     = null
}

variable "create_route53_records" {
  description = "Whether Terraform should manage Route53 alias records."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional environment-specific tags."
  type        = map(string)
  default     = {}
}

variable "backend_lambda_memory_size" {
  description = "Memory size for backend Lambda functions in dev."
  type        = number
  default     = 256
}

variable "backend_lambda_timeout_seconds" {
  description = "Timeout for backend Lambda functions in dev."
  type        = number
  default     = 10
}
