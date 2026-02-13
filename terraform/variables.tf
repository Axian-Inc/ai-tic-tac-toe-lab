variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)."
  type        = string
}

variable "resource_suffix" {
  description = "Suffix appended to resource names."
  type        = string
  default     = "-tg"
}

variable "server_image_tag" {
  description = "Tag for the multiplayer server image in ECR."
  type        = string
  default     = "latest"
}

variable "server_image_override" {
  description = "Optional override for the multiplayer server image (non-ECR)."
  type        = string
  default     = ""
}

variable "server_port" {
  description = "Port the multiplayer server listens on."
  type        = number
  default     = 3001
}

variable "server_desired_count" {
  description = "Number of server tasks to run."
  type        = number
  default     = 1
}
