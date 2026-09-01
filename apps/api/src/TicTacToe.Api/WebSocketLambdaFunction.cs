using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Lambda.Serialization.SystemTextJson;
using TicTacToe.Api.Domain;

[assembly: LambdaSerializer(typeof(DefaultLambdaJsonSerializer))]

namespace TicTacToe.Api;

/// <summary>
/// API Gateway WebSocket lifecycle entry point. Durable subscription storage and
/// management-API delivery are supplied by the production adapter; this entry
/// point deliberately validates the frozen wire envelope before dispatch.
/// </summary>
public sealed class WebSocketLambdaFunction
{
    public const string Handler = "TicTacToe.Api::TicTacToe.Api.WebSocketLambdaFunction::FunctionHandlerAsync";

    public Task<APIGatewayProxyResponse> FunctionHandlerAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(context);

        return HandleAsync(request);
    }

    private static async Task<APIGatewayProxyResponse> HandleAsync(APIGatewayProxyRequest request)
    {
        var routeKey = request.RequestContext?.RouteKey;
        var connectionId = request.RequestContext?.ConnectionId;
        if (string.IsNullOrWhiteSpace(connectionId)) return Response(400, "invalid_connection");
        var runtime = AwsRuntime.Instance;
        if (routeKey == "$connect") { await runtime.WebSockets.ConnectAsync(connectionId, default); return Response(200); }
        if (routeKey == "$disconnect") { await runtime.WebSockets.DisconnectAsync(connectionId, default); return Response(200); }

        if (routeKey is not "subscribe")
        {
            await RejectAsync(runtime, connectionId, null, "unsupported_route", "The WebSocket route is unsupported.");
            return Response(200);
        }

        try
        {
            var message = JsonSerializer.Deserialize<SubscriptionRequest>(request.Body ?? string.Empty,
                new JsonSerializerOptions(JsonSerializerDefaults.Web));
            if (message is not null && message.Version != 1)
            {
                await RejectAsync(runtime, connectionId, message, "unsupported_version", "Only WebSocket protocol version 1 is supported.");
                return Response(200);
            }
            if (message is null || message.Action != "subscribe" ||
                message.RequestId == Guid.Empty || string.IsNullOrWhiteSpace(message.GameId) ||
                message.AfterSequence < 0)
            {
                await RejectAsync(runtime, connectionId, message, "invalid_message", "The subscription message is invalid.");
                return Response(200);
            }
            await runtime.WebSockets.SubscribeAsync(connectionId, message.GameId, default);
            try
            {
                var snapshot = await runtime.Service.GetAsync(message.GameId);
                if (message.AfterSequence > snapshot.Sequence) throw GameRuleException.Conflict("invalid_cursor", "afterSequence exceeds the current game sequence.");
                await runtime.WebSockets.SendAsync(connectionId, new { version = 1, type = "subscription.accepted",
                    message.RequestId, message.GameId, throughSequence = snapshot.Sequence, snapshot }, default);
                return Response(200);
            }
            catch (GameRuleException exception) when (exception.Code is "game_not_found" or "invalid_cursor")
            {
                await runtime.WebSockets.UnsubscribeAsync(connectionId, message.GameId, default);
                await runtime.WebSockets.SendAsync(connectionId, new { version = 1, type = "subscription.rejected",
                    message.RequestId, message.GameId, exception.Code, detail = exception.Message }, default);
                return Response(200);
            }
        }
        catch (JsonException)
        {
            await RejectAsync(runtime, connectionId, null, "invalid_message", "The subscription message is invalid.");
            return Response(200);
        }
    }

    private static Task RejectAsync(AwsRuntime runtime, string connectionId, SubscriptionRequest? message, string code, string detail) =>
        runtime.WebSockets.SendAsync(connectionId, new { version = 1, type = "subscription.rejected",
            requestId = message?.RequestId, gameId = message?.GameId, code, detail }, default);

    private static APIGatewayProxyResponse Response(int statusCode, string? code = null) => new()
    {
        StatusCode = statusCode,
        Headers = new Dictionary<string, string> { ["content-type"] = "application/json" },
        Body = code is null ? string.Empty : JsonSerializer.Serialize(new { code })
    };
}

public static class LambdaDeployment
{
    public const string PublishDirectory = "artifacts/lambda";
    public const string HttpHandler = "TicTacToe.Api";
    public const string WebSocketHandler = WebSocketLambdaFunction.Handler;
}
