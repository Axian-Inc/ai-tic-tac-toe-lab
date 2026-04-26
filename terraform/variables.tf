variable "aws_region" {
  description = "AWS region for the S3 static website bucket."
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project prefix used for naming AWS resources."
  type        = string
  default     = "ai-tic-tac-toe-lab"
}

variable "bucket_name" {
  description = "Optional explicit S3 bucket name. Leave blank to derive one from project, workspace, and AWS account."
  type        = string
  default     = ""
}
