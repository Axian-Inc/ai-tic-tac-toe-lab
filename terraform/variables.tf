variable "aws_region" {
  description = "AWS region that hosts the static website bucket."
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Globally unique S3 bucket name for the static website."
  type        = string
}

variable "server_image" {
  description = "Container image URI for the multiplayer server (e.g., ECR or public registry)."
  type        = string
}

variable "server_port" {
  description = "Port the multiplayer server listens on."
  type        = number
  default     = 5174
}

variable "server_cpu" {
  description = "CPU units for the multiplayer server task."
  type        = number
  default     = 256
}

variable "server_memory" {
  description = "Memory (MiB) for the multiplayer server task."
  type        = number
  default     = 512
}

variable "server_desired_count" {
  description = "Desired number of multiplayer server tasks."
  type        = number
  default     = 1
}

variable "tags" {
  description = "Tags applied to all managed AWS resources."
  type        = map(string)
  default = {
    Project = "ai-tic-tac-toe-lab"
  }
}
