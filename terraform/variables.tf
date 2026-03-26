variable "bucket_name" {
  description = "Globally unique S3 bucket name for the static website."
  type        = string
}

variable "server_port" {
  description = "Port the multiplayer server listens on."
  type        = number
  default     = 5174
}

variable "server_instance_type" {
  description = "EC2 instance type for the multiplayer server."
  type        = string
  default     = "t3.micro"
}

variable "tags" {
  description = "Tags applied to all managed AWS resources."
  type        = map(string)
  default = {
    Project = "ai-tic-tac-toe-lab"
  }
}
