output "bucket_name" {
  description = "S3 bucket name for static website assets."
  value       = aws_s3_bucket.site.bucket
}

output "website_endpoint" {
  description = "S3 static website endpoint."
  value       = aws_s3_bucket_website_configuration.site.website_endpoint
}

output "website_url" {
  description = "HTTP URL for the S3 static website."
  value       = "http://${aws_s3_bucket_website_configuration.site.website_endpoint}"
}
