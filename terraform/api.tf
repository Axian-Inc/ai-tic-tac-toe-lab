locals {
  api_name             = "${local.project_slug}-${local.workspace_slug}-api"
  websocket_stage_name = "prod"

  api_lambda_handlers = {
    http          = "handlers/http.handler"
    ws_connect    = "handlers/ws-connect.handler"
    ws_disconnect = "handlers/ws-disconnect.handler"
    ws_default    = "handlers/ws-default.handler"
  }

  websocket_callback_endpoint = "https://${aws_apigatewayv2_api.websocket.id}.execute-api.${var.aws_region}.amazonaws.com/${local.websocket_stage_name}"
}

resource "aws_dynamodb_table" "games" {
  name         = "${local.api_name}-games"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-games"
  })
}

resource "aws_dynamodb_table" "game_events" {
  name         = "${local.api_name}-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "gameId"
  range_key    = "sequence"

  attribute {
    name = "gameId"
    type = "S"
  }

  attribute {
    name = "sequence"
    type = "N"
  }

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-events"
  })
}

resource "aws_dynamodb_table" "connections" {
  name         = "${local.api_name}-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  attribute {
    name = "gameId"
    type = "S"
  }

  global_secondary_index {
    name            = "gameId-index"
    hash_key        = "gameId"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-connections"
  })
}

resource "aws_dynamodb_table" "counters" {
  name         = "${local.api_name}-counters"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-counters"
  })
}

data "archive_file" "api_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../api/dist"
  output_path = "${path.module}/.terraform/api-lambda.zip"
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api_lambda" {
  name               = "${local.api_name}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "api_lambda_basic" {
  role       = aws_iam_role.api_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "api_lambda_data_access" {
  statement {
    actions = [
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:TransactWriteItems",
      "dynamodb:UpdateItem",
    ]

    resources = [
      aws_dynamodb_table.games.arn,
      aws_dynamodb_table.game_events.arn,
      aws_dynamodb_table.connections.arn,
      "${aws_dynamodb_table.connections.arn}/index/*",
      aws_dynamodb_table.counters.arn,
    ]
  }

  statement {
    actions = [
      "execute-api:ManageConnections",
    ]

    resources = [
      "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_apigatewayv2_api.websocket.id}/*/@connections/*",
    ]
  }
}

resource "aws_iam_role_policy" "api_lambda_data_access" {
  name   = "${local.api_name}-data-access"
  role   = aws_iam_role.api_lambda.id
  policy = data.aws_iam_policy_document.api_lambda_data_access.json
}

resource "aws_lambda_function" "api" {
  for_each = local.api_lambda_handlers

  function_name    = "${local.api_name}-${replace(each.key, "_", "-")}"
  role             = aws_iam_role.api_lambda.arn
  handler          = each.value
  runtime          = "nodejs22.x"
  filename         = data.archive_file.api_lambda.output_path
  source_code_hash = data.archive_file.api_lambda.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      GAMES_TABLE_NAME            = aws_dynamodb_table.games.name
      EVENTS_TABLE_NAME           = aws_dynamodb_table.game_events.name
      CONNECTIONS_TABLE_NAME      = aws_dynamodb_table.connections.name
      COUNTERS_TABLE_NAME         = aws_dynamodb_table.counters.name
      CONNECTIONS_GAME_INDEX_NAME = "gameId-index"
      WEBSOCKET_CALLBACK_ENDPOINT = local.websocket_callback_endpoint
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-${replace(each.key, "_", "-")}"
  })
}

resource "aws_cloudwatch_log_group" "api_lambda" {
  for_each = aws_lambda_function.api

  name              = "/aws/lambda/${each.value.function_name}"
  retention_in_days = 14

  tags = local.common_tags
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${local.api_name}-http"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = ["*"]
  }

  tags = local.common_tags
}

resource "aws_apigatewayv2_integration" "http_lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api["http"].invoke_arn
  payload_format_version = "2.0"
}

locals {
  http_routes = toset([
    "GET /api/health",
    "POST /api/games",
    "GET /api/games/{gameId}",
    "GET /api/games/{gameId}/events",
    "POST /api/games/{gameId}/join",
    "POST /api/games/{gameId}/moves",
    "POST /api/games/{gameId}/resign",
    "POST /api/games/{gameId}/abandonment-check",
  ])
}

resource "aws_apigatewayv2_route" "http" {
  for_each = local.http_routes

  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.http_lambda.id}"
}

resource "aws_apigatewayv2_stage" "http_default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  tags = local.common_tags
}

resource "aws_lambda_permission" "http_api" {
  statement_id  = "AllowHttpApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api["http"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_apigatewayv2_api" "websocket" {
  name                       = "${local.api_name}-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.type"

  tags = local.common_tags
}

resource "aws_apigatewayv2_integration" "websocket" {
  for_each = {
    connect    = aws_lambda_function.api["ws_connect"].invoke_arn
    disconnect = aws_lambda_function.api["ws_disconnect"].invoke_arn
    default    = aws_lambda_function.api["ws_default"].invoke_arn
  }

  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = each.value
}

resource "aws_apigatewayv2_route" "websocket_connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket["connect"].id}"
}

resource "aws_apigatewayv2_route" "websocket_disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket["disconnect"].id}"
}

resource "aws_apigatewayv2_route" "websocket_default" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.websocket["default"].id}"
}

resource "aws_apigatewayv2_stage" "websocket" {
  api_id      = aws_apigatewayv2_api.websocket.id
  name        = local.websocket_stage_name
  auto_deploy = true

  tags = local.common_tags
}

resource "aws_lambda_permission" "websocket_api" {
  for_each = {
    ws_connect    = aws_lambda_function.api["ws_connect"].function_name
    ws_disconnect = aws_lambda_function.api["ws_disconnect"].function_name
    ws_default    = aws_lambda_function.api["ws_default"].function_name
  }

  statement_id  = "AllowWebSocketApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = each.value
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*"
}
