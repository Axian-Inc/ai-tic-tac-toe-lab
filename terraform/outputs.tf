output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "server_api_base_url" {
  description = "Multiplayer server base URL."
  value       = "http://${aws_lb.server.dns_name}"
}

output "server_ecr_repository_url" {
  description = "ECR repository URL for the multiplayer server image."
  value       = aws_ecr_repository.server.repository_url
}

output "server_ecs_cluster_name" {
  description = "ECS cluster name for the multiplayer server."
  value       = aws_ecs_cluster.server.name
}

output "server_ecs_service_name" {
  description = "ECS service name for the multiplayer server."
  value       = aws_ecs_service.server.name
}

output "server_games_table_name" {
  description = "DynamoDB table storing game records."
  value       = aws_dynamodb_table.games.name
}
