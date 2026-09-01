using System.Net.WebSockets;
using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.Lambda.AspNetCoreServer.Hosting;
using Amazon.ApiGatewayManagementApi;
using Amazon.DynamoDBv2;
using TicTacToe.Api;
using TicTacToe.Api.Application;
using TicTacToe.Api.Domain;

var builder = WebApplication.CreateBuilder(args);
var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);
json.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
builder.Services.AddSingleton(json);
builder.Services.AddSingleton<TimeProvider>(TimeProvider.System);
builder.Services.AddSingleton<IIdentifierGenerator, GuidIdentifierGenerator>();
builder.Services.AddSingleton<CryptographicCapabilityProvider>();
builder.Services.AddSingleton<ICapabilityGenerator>(provider => provider.GetRequiredService<CryptographicCapabilityProvider>());
builder.Services.AddSingleton<ICapabilityHasher>(provider => provider.GetRequiredService<CryptographicCapabilityProvider>());
var isAws = !string.IsNullOrWhiteSpace(builder.Configuration["GAME_TABLE_NAME"]);
if (isAws)
{
    builder.Services.AddSingleton<IAmazonDynamoDB>(_ => new AmazonDynamoDBClient());
    builder.Services.AddSingleton<IAmazonApiGatewayManagementApi>(_ => new AmazonApiGatewayManagementApiClient(
        new AmazonApiGatewayManagementApiConfig { ServiceURL = builder.Configuration["WEBSOCKET_MANAGEMENT_ENDPOINT"]
            ?? throw new InvalidOperationException("WEBSOCKET_MANAGEMENT_ENDPOINT is required.") }));
    builder.Services.AddSingleton<DynamoGameStore>();
    builder.Services.AddSingleton<IGameStore>(provider => provider.GetRequiredService<DynamoGameStore>());
    builder.Services.AddSingleton<ICapacityReconciler>(provider => provider.GetRequiredService<DynamoGameStore>());
    builder.Services.AddSingleton<DynamoWebSocketAdapter>();
    builder.Services.AddSingleton<IGameBroadcaster>(provider => provider.GetRequiredService<DynamoWebSocketAdapter>());
}
else
{
    builder.Services.AddSingleton<InMemoryGameStore>();
    builder.Services.AddSingleton<IGameStore>(provider => provider.GetRequiredService<InMemoryGameStore>());
    builder.Services.AddSingleton<ICapacityReconciler>(provider => provider.GetRequiredService<InMemoryGameStore>());
    builder.Services.AddSingleton<LocalWebSocketHub>();
    builder.Services.AddSingleton<IGameBroadcaster>(provider => provider.GetRequiredService<LocalWebSocketHub>());
}
builder.Services.AddSingleton<MultiplayerService>();
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

var app = builder.Build();
if (args is ["capacity", "reconcile", "--report"])
{
    var report = await app.Services.GetRequiredService<ICapacityReconciler>().ReportAsync(default);
    Console.WriteLine(JsonSerializer.Serialize(report, json));
    return;
}
if (args is ["capacity", "reconcile", "--apply", var version, var stored] &&
    long.TryParse(version, out var expectedVersion) && int.TryParse(stored, out var expectedStored))
{
    var report = await app.Services.GetRequiredService<ICapacityReconciler>()
        .RepairAsync(expectedVersion, expectedStored, default);
    Console.WriteLine(JsonSerializer.Serialize(report, json));
    return;
}
app.UseWebSockets();
app.Use(async (context, next) =>
{
    try { await next(context); }
    catch (GameRuleException exception)
    {
        context.Response.StatusCode = exception.Status;
        context.Response.ContentType = "application/problem+json";
        if (exception.Status == 429) context.Response.Headers.RetryAfter = "5";
        await context.Response.WriteAsJsonAsync(new
        {
            type = $"https://example.invalid/problems/{exception.Code}",
            title = Title(exception.Status),
            status = exception.Status,
            detail = exception.Message,
            instance = context.Request.Path.Value,
            code = exception.Code,
            traceId = context.TraceIdentifier,
            currentSequence = exception.CurrentSequence,
            eligibleAt = exception.EligibleAt
        }, json, "application/problem+json", context.RequestAborted);
    }
});

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
var games = app.MapGroup("/api/v1/games");

games.MapPost("", async (CreateGameCommand command, HttpResponse httpResponse, MultiplayerService service, CancellationToken cancellationToken) =>
{
    var response = await service.CreateAsync(command, cancellationToken);
    httpResponse.Headers.Location = $"/api/v1/games/{response.Game.Id}";
    return Results.Json(response, json, statusCode: 201, contentType: "application/json");
});

games.MapGet("", async (string status, string? cursor, int? limit, MultiplayerService service, CancellationToken cancellationToken) =>
{
    if (!Enum.TryParse<GameStatus>(status, true, out var parsed)) throw GameRuleException.Invalid("status must be waiting, active, or over.");
    return Results.Json(await service.ListAsync(parsed, cursor, limit ?? 25, cancellationToken), json);
});

games.MapGet("/{gameId}", async (string gameId, MultiplayerService service, CancellationToken cancellationToken) =>
    Results.Json(await service.GetAsync(gameId, cancellationToken), json));

games.MapGet("/{gameId}/events", async (string gameId, long? afterSequence, string? cursor, int? limit,
    MultiplayerService service, CancellationToken cancellationToken) =>
    Results.Json(await service.GetEventsAsync(gameId, afterSequence ?? 0, cursor, limit ?? 100, cancellationToken), json));

games.MapPost("/{gameId}/join", async (string gameId, SequencedCommand command, MultiplayerService service, CancellationToken cancellationToken) =>
    Results.Json(await service.JoinAsync(gameId, command, cancellationToken), json));

games.MapPost("/{gameId}/moves", async (HttpRequest request, string gameId, MoveCommand command, MultiplayerService service, CancellationToken cancellationToken) =>
    Results.Json(await service.MoveAsync(gameId, Bearer(request), command, cancellationToken), json));

games.MapPost("/{gameId}/resign", async (HttpRequest request, string gameId, SequencedCommand command, MultiplayerService service, CancellationToken cancellationToken) =>
    Results.Json(await service.ResignAsync(gameId, Bearer(request), command, cancellationToken), json));

games.MapPost("/{gameId}/abandonment-check", async (HttpRequest request, string gameId, SequencedCommand command,
    MultiplayerService service, CancellationToken cancellationToken) =>
    Results.Json(await service.CheckAbandonmentAsync(gameId, Bearer(request), command, cancellationToken), json));

app.Map("/ws", async (HttpContext context, MultiplayerService service, IServiceProvider services, CancellationToken cancellationToken) =>
{
    var hub = services.GetService<LocalWebSocketHub>();
    if (hub is null) { context.Response.StatusCode = 404; return; }
    if (!context.WebSockets.IsWebSocketRequest) { context.Response.StatusCode = 400; return; }
    using var socket = await context.WebSockets.AcceptWebSocketAsync();
    var connectionId = Guid.NewGuid().ToString("N");
    var buffer = new byte[8192];
    try
    {
        while (socket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
        {
            var received = await socket.ReceiveAsync(buffer, cancellationToken);
            if (received.MessageType == WebSocketMessageType.Close) break;
            SubscriptionRequest? request;
            try { request = JsonSerializer.Deserialize<SubscriptionRequest>(buffer.AsSpan(0, received.Count), json); }
            catch (JsonException) { request = null; }
            if (request is not null && request.Version != 1)
            {
                await SendAsync(socket, new { version = 1, type = "subscription.rejected", requestId = request.RequestId,
                    gameId = request.GameId, code = "unsupported_version", detail = "Only WebSocket protocol version 1 is supported." }, json, cancellationToken);
                continue;
            }
            if (request is null || request.Action != "subscribe" || request.RequestId == Guid.Empty ||
                string.IsNullOrWhiteSpace(request.GameId) || request.AfterSequence < 0)
            {
                await SendAsync(socket, new { version = 1, type = "subscription.rejected", requestId = request?.RequestId,
                    gameId = request?.GameId, code = "invalid_message", detail = "The subscription message is invalid." }, json, cancellationToken);
                continue;
            }
            hub.Subscribe(connectionId, request.GameId, socket); // register before the authoritative read
            try
            {
                var snapshot = await service.GetAsync(request.GameId, cancellationToken);
                if (request.AfterSequence > snapshot.Sequence)
                    throw GameRuleException.Conflict("invalid_cursor", "afterSequence exceeds the current game sequence.");
                await SendAsync(socket, new { version = 1, type = "subscription.accepted", requestId = request.RequestId,
                    gameId = request.GameId, throughSequence = snapshot.Sequence, snapshot }, json, cancellationToken);
            }
            catch (GameRuleException exception) when (exception.Code is "game_not_found" or "invalid_cursor")
            {
                await SendAsync(socket, new { version = 1, type = "subscription.rejected", requestId = request.RequestId,
                    gameId = request.GameId, code = exception.Code, detail = exception.Message }, json, cancellationToken);
            }
        }
    }
    finally { hub.Remove(connectionId); }
});

app.Run();

static string? Bearer(HttpRequest request)
{
    var value = request.Headers.Authorization.ToString();
    return value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? value[7..].Trim() : null;
}

static Task SendAsync(WebSocket socket, object message, JsonSerializerOptions json, CancellationToken cancellationToken) =>
    socket.SendAsync(JsonSerializer.SerializeToUtf8Bytes(message, json), WebSocketMessageType.Text, true, cancellationToken);

static string Title(int status) => status switch
{
    400 => "Invalid request", 401 => "Invalid capability", 404 => "Game not found",
    409 => "Command conflict", 429 => "Game capacity exhausted", _ => "Request failed"
};

public sealed record SubscriptionRequest(int Version, string Action, Guid RequestId, string GameId, long AfterSequence = 0);

// Exposes the generated entry point to future integration-test projects.
public partial class Program
{
}
