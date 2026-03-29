output "frontend_bucket_name" {
  description = "Private S3 bucket that stores frontend artifacts."
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "ARN of the private S3 bucket used as the CloudFront origin."
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_distribution_id" {
  description = "CloudFront distribution ID."
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_distribution_domain_name" {
  description = "CloudFront distribution DNS name."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_distribution_hosted_zone_id" {
  description = "Hosted zone ID for CloudFront aliases."
  value       = aws_cloudfront_distribution.frontend.hosted_zone_id
}
