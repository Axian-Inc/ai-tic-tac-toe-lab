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

output "api_http_endpoint" {
  description = "HTTP API Gateway endpoint for backend API requests."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "api_websocket_endpoint" {
  description = "WebSocket API Gateway endpoint for real-time game updates."
  value       = "${aws_apigatewayv2_api.websocket.api_endpoint}/${aws_apigatewayv2_stage.websocket.name}"
}
