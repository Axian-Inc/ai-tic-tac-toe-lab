output "bucket_name" {
  description = "Name of the S3 bucket hosting the static site."
  value       = aws_s3_bucket.site.bucket
}

output "website_url" {
  description = "Public website URL for the static site."
  value       = "http://${aws_s3_bucket_website_configuration.site.website_endpoint}"
}

output "aws_region" {
  description = "AWS region used for deployment."
  value       = var.aws_region
}

output "server_image" {
  description = "Container image URI for the multiplayer server."
  value       = var.server_image
}

output "server_url" {
  description = "Multiplayer server base URL."
  value       = "http://${aws_lb.server.dns_name}"
}
