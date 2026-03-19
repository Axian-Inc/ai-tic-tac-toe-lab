output "bucket_name" {
  description = "Name of the S3 bucket hosting the static site."
  value       = aws_s3_bucket.site.bucket
}

output "website_url" {
  description = "Public website URL for the static site."
  value       = "http://${aws_s3_bucket_website_configuration.site.website_endpoint}"
}
