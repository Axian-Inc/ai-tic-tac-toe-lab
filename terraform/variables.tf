variable "aws_region" {
  description = "AWS region that hosts the static website bucket."
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Globally unique S3 bucket name for the static website."
  type        = string
}

variable "tags" {
  description = "Tags applied to all managed AWS resources."
  type        = map(string)
  default = {
    Project = "ai-tic-tac-toe-lab"
  }
}
