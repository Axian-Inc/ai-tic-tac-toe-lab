output "bucket_name" {
  description = "Name of the S3 bucket backing the site."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_url" {
  description = "CloudFront URL for the site."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID."
  value       = aws_cloudfront_distribution.site.id
}
