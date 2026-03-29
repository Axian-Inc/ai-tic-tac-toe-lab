output "games_table_name" {
  description = "DynamoDB table for game snapshots."
  value       = aws_dynamodb_table.games.name
}

output "game_events_table_name" {
  description = "DynamoDB table for ordered game events."
  value       = aws_dynamodb_table.game_events.name
}

output "connections_table_name" {
  description = "DynamoDB table for WebSocket connection metadata."
  value       = aws_dynamodb_table.connections.name
}

output "http_api_url" {
  description = "Invoke URL for the HTTP multiplayer API."
  value       = aws_apigatewayv2_stage.http.invoke_url
}

output "websocket_api_url" {
  description = "WebSocket URL for multiplayer live updates."
  value       = aws_apigatewayv2_stage.websocket.invoke_url
}
