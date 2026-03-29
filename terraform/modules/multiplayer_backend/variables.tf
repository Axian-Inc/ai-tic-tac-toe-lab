variable "name_prefix" {
  description = "Resource name prefix."
  type        = string
}

variable "aws_region" {
  description = "AWS region for backend resources."
  type        = string
}

variable "frontend_base_url" {
  description = "Base URL for frontend deep links returned by the backend."
  type        = string
}

variable "lambda_package_path" {
  description = "Path to the packaged backend Lambda source directory."
  type        = string
}

variable "lambda_memory_size" {
  description = "Memory size for backend Lambda functions."
  type        = number
  default     = 256
}

variable "lambda_timeout_seconds" {
  description = "Timeout for backend Lambda functions."
  type        = number
  default     = 10
}

variable "tags" {
  description = "Tags to apply to backend resources."
  type        = map(string)
  default     = {}
}
