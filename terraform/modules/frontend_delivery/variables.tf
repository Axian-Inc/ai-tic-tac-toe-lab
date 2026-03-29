variable "name_prefix" {
  description = "Prefix used to build globally unique resource names."
  type        = string
}

variable "bucket_force_destroy" {
  description = "Whether the frontend bucket may be force-destroyed."
  type        = bool
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
}

variable "domain_aliases" {
  description = "Optional custom domains for the frontend."
  type        = list(string)
}

variable "acm_certificate_arn" {
  description = "Optional ACM certificate ARN in us-east-1."
  type        = string
  default     = null
}

variable "route53_zone_id" {
  description = "Optional Route53 hosted zone ID used for alias records."
  type        = string
  default     = null
}

variable "create_route53_records" {
  description = "Whether to create Route53 alias records for the supplied domain aliases."
  type        = bool
}

variable "tags" {
  description = "Tags to apply to supported resources."
  type        = map(string)
}
