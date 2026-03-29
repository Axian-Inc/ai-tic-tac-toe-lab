output "frontend_bucket_name" {
  description = "Private S3 bucket that stores the frontend build artifacts."
  value       = module.frontend_delivery.frontend_bucket_name
}

output "frontend_distribution_id" {
  description = "CloudFront distribution ID for the frontend."
  value       = module.frontend_delivery.frontend_distribution_id
}

output "frontend_distribution_domain_name" {
  description = "CloudFront domain name for the deployed frontend."
  value       = module.frontend_delivery.frontend_distribution_domain_name
}

output "frontend_distribution_hosted_zone_id" {
  description = "CloudFront hosted zone ID, useful for Route53 alias records."
  value       = module.frontend_delivery.frontend_distribution_hosted_zone_id
}

output "frontend_origin_bucket_arn" {
  description = "ARN of the S3 origin bucket."
  value       = module.frontend_delivery.frontend_bucket_arn
}

output "backend_games_table_name" {
  description = "DynamoDB table used for multiplayer game snapshots."
  value       = module.multiplayer_backend.games_table_name
}

output "backend_game_events_table_name" {
  description = "DynamoDB table used for ordered multiplayer events."
  value       = module.multiplayer_backend.game_events_table_name
}

output "backend_connections_table_name" {
  description = "DynamoDB table used for WebSocket connection tracking."
  value       = module.multiplayer_backend.connections_table_name
}

output "backend_http_api_url" {
  description = "HTTP API base URL for multiplayer backend requests."
  value       = module.multiplayer_backend.http_api_url
}

output "backend_websocket_api_url" {
  description = "WebSocket API URL for multiplayer live updates."
  value       = module.multiplayer_backend.websocket_api_url
}
