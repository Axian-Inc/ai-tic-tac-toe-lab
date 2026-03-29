data "archive_file" "backend_package" {
  type        = "zip"
  source_dir  = var.lambda_package_path
  output_path = "${path.module}/.terraform-artifacts/${var.name_prefix}-backend.zip"
}

locals {
  lambda_runtime = "nodejs22.x"
  lambda_package_environment = {
    GAMES_TABLE_NAME              = aws_dynamodb_table.games.name
    GAME_EVENTS_TABLE_NAME        = aws_dynamodb_table.game_events.name
    CONNECTIONS_TABLE_NAME        = aws_dynamodb_table.connections.name
    FRONTEND_BASE_URL             = var.frontend_base_url
    WEBSOCKET_MANAGEMENT_ENDPOINT = replace(aws_apigatewayv2_stage.websocket.invoke_url, "wss://", "https://")
  }

  http_handlers = {
    create_game       = "dist/backend/src/lambda/http/createGame.handler"
    get_game          = "dist/backend/src/lambda/http/getGame.handler"
    list_games        = "dist/backend/src/lambda/http/listGames.handler"
    join_game         = "dist/backend/src/lambda/http/joinGame.handler"
    post_move         = "dist/backend/src/lambda/http/postMove.handler"
    resign_game       = "dist/backend/src/lambda/http/resignGame.handler"
    spectate_game     = "dist/backend/src/lambda/http/spectateGame.handler"
    abandonment_check = "dist/backend/src/lambda/http/abandonmentCheck.handler"
  }

  websocket_handlers = {
    connect    = "dist/backend/src/lambda/websocket/connect.handler"
    disconnect = "dist/backend/src/lambda/websocket/disconnect.handler"
    default    = "dist/backend/src/lambda/websocket/default.handler"
  }
}

resource "aws_dynamodb_table" "games" {
  name         = "${var.name_prefix}-games"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "gameId"

  attribute {
    name = "gameId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "status-createdAt-index"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "game_events" {
  name         = "${var.name_prefix}-game-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "gameId"
  range_key    = "sequenceNumber"

  attribute {
    name = "gameId"
    type = "S"
  }

  attribute {
    name = "sequenceNumber"
    type = "N"
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "connections" {
  name         = "${var.name_prefix}-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "gameId"
  range_key    = "connectionId"

  attribute {
    name = "gameId"
    type = "S"
  }

  attribute {
    name = "connectionId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = var.tags
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name_prefix}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "lambda_permissions" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchWriteItem",
    ]
    resources = [
      aws_dynamodb_table.games.arn,
      "${aws_dynamodb_table.games.arn}/index/status-createdAt-index",
      aws_dynamodb_table.game_events.arn,
      aws_dynamodb_table.connections.arn,
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "execute-api:ManageConnections",
    ]
    resources = [
      "${aws_apigatewayv2_api.websocket.execution_arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "lambda" {
  name   = "${var.name_prefix}-lambda-policy"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}

resource "aws_lambda_function" "http" {
  for_each = local.http_handlers

  function_name    = "${var.name_prefix}-${replace(each.key, "_", "-")}"
  role             = aws_iam_role.lambda.arn
  runtime          = local.lambda_runtime
  handler          = each.value
  filename         = data.archive_file.backend_package.output_path
  source_code_hash = data.archive_file.backend_package.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout_seconds

  environment {
    variables = local.lambda_package_environment
  }

  tags = var.tags
}

resource "aws_lambda_function" "websocket" {
  for_each = local.websocket_handlers

  function_name    = "${var.name_prefix}-ws-${replace(each.key, "_", "-")}"
  role             = aws_iam_role.lambda.arn
  runtime          = local.lambda_runtime
  handler          = each.value
  filename         = data.archive_file.backend_package.output_path
  source_code_hash = data.archive_file.backend_package.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout_seconds

  environment {
    variables = local.lambda_package_environment
  }

  tags = var.tags
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.name_prefix}-http"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = [var.frontend_base_url]
  }

  tags = var.tags
}

resource "aws_apigatewayv2_stage" "http" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "http" {
  for_each = aws_lambda_function.http

  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "http" {
  for_each = {
    "POST /games"                        = "create_game"
    "GET /games/{id}"                    = "get_game"
    "GET /games"                         = "list_games"
    "POST /games/{id}/join"              = "join_game"
    "POST /games/{id}/moves"             = "post_move"
    "POST /games/{id}/resign"            = "resign_game"
    "POST /games/{id}/spectate"          = "spectate_game"
    "POST /games/{id}/abandonment-check" = "abandonment_check"
  }

  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.http[each.value].id}"
}

resource "aws_lambda_permission" "http" {
  for_each = aws_lambda_function.http

  statement_id  = "AllowHttpApiInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_apigatewayv2_api" "websocket" {
  name                       = "${var.name_prefix}-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"

  tags = var.tags
}

resource "aws_apigatewayv2_stage" "websocket" {
  api_id      = aws_apigatewayv2_api.websocket.id
  name        = "prod"
  auto_deploy = true

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "websocket" {
  for_each = aws_lambda_function.websocket

  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = each.value.invoke_arn
}

resource "aws_apigatewayv2_route" "websocket" {
  for_each = {
    "$connect"    = "connect"
    "$disconnect" = "disconnect"
    "$default"    = "default"
  }

  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.websocket[each.value].id}"
}

resource "aws_lambda_permission" "websocket" {
  for_each = aws_lambda_function.websocket

  statement_id  = "AllowWebSocketInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*"
}
