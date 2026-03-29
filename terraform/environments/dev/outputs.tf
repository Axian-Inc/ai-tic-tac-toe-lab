output "frontend_bucket_name" {
  description = "Private S3 bucket used for the frontend build."
  value       = module.stack.frontend_bucket_name
}

output "frontend_distribution_id" {
  description = "CloudFront distribution ID."
  value       = module.stack.frontend_distribution_id
}

output "frontend_distribution_domain_name" {
  description = "CloudFront domain for the dev frontend."
  value       = module.stack.frontend_distribution_domain_name
}

output "backend_http_api_url" {
  description = "HTTP API URL for the dev multiplayer backend."
  value       = module.stack.backend_http_api_url
}

output "backend_websocket_api_url" {
  description = "WebSocket URL for the dev multiplayer backend."
  value       = module.stack.backend_websocket_api_url
}
