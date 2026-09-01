using System.Globalization;
using System.Net;
using System.Text.Json;
using Amazon.ApiGatewayManagementApi;
using Amazon.ApiGatewayManagementApi.Model;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using TicTacToe.Api.Application;

namespace TicTacToe.Api;

/// <summary>Durable subscriptions and API Gateway Management API event delivery.</summary>
public sealed class DynamoWebSocketAdapter : IGameBroadcaster
{
    private readonly IAmazonDynamoDB dynamo;
    private readonly IAmazonApiGatewayManagementApi management;
    private readonly string table;
    private readonly string index;
    private readonly JsonSerializerOptions json;

    public DynamoWebSocketAdapter(IAmazonDynamoDB dynamo, IAmazonApiGatewayManagementApi management,
        IConfiguration configuration, JsonSerializerOptions json)
    {
        this.dynamo = dynamo;
        this.management = management;
        this.json = json;
        table = configuration["CONNECTION_TABLE_NAME"] ?? throw new InvalidOperationException("CONNECTION_TABLE_NAME is required.");
        index = configuration["GAME_SUBSCRIPTIONS_INDEX_NAME"] ?? throw new InvalidOperationException("GAME_SUBSCRIPTIONS_INDEX_NAME is required.");
    }

    public Task ConnectAsync(string connectionId, CancellationToken token) => dynamo.PutItemAsync(new PutItemRequest
    {
        TableName = table,
        Item = new() { ["PK"] = S(ConnectionPk(connectionId)), ["SK"] = S("META"),
            ["expiresAt"] = N(DateTimeOffset.UtcNow.AddHours(2).ToUnixTimeSeconds()) }
    }, token);

    public async Task DisconnectAsync(string connectionId, CancellationToken token)
    {
        Dictionary<string, AttributeValue>? start = null;
        do
        {
            var page = await dynamo.QueryAsync(new QueryRequest { TableName = table,
                KeyConditionExpression = "PK = :pk", ExpressionAttributeValues = new() { [":pk"] = S(ConnectionPk(connectionId)) },
                ExclusiveStartKey = start }, token);
            foreach (var item in page.Items)
                await dynamo.DeleteItemAsync(table, new() { ["PK"] = item["PK"], ["SK"] = item["SK"] }, token);
            start = page.LastEvaluatedKey;
        } while (start is { Count: > 0 });
    }

    public Task SubscribeAsync(string connectionId, string gameId, CancellationToken token) => dynamo.PutItemAsync(new PutItemRequest
    {
        TableName = table,
        Item = new() { ["PK"] = S(ConnectionPk(connectionId)), ["SK"] = S(GameSk(gameId)),
            ["GSI1PK"] = S(GamePk(gameId)), ["GSI1SK"] = S(ConnectionPk(connectionId)),
            ["expiresAt"] = N(DateTimeOffset.UtcNow.AddHours(2).ToUnixTimeSeconds()) }
    }, token);

    public Task UnsubscribeAsync(string connectionId, string gameId, CancellationToken token) =>
        dynamo.DeleteItemAsync(table, new() { ["PK"] = S(ConnectionPk(connectionId)), ["SK"] = S(GameSk(gameId)) }, token);

    public Task SendAsync(string connectionId, object payload, CancellationToken token) =>
        SendBytesAsync(connectionId, JsonSerializer.SerializeToUtf8Bytes(payload, json), token);

    public async Task PublishAsync(GameEvent gameEvent, CancellationToken cancellationToken)
    {
        var response = await dynamo.QueryAsync(new QueryRequest { TableName = table, IndexName = index,
            KeyConditionExpression = "GSI1PK = :game", ExpressionAttributeValues = new() { [":game"] = S(GamePk(gameEvent.GameId)) } }, cancellationToken);
        var payload = JsonSerializer.SerializeToUtf8Bytes(new { version = 1, type = "game.event", gameEvent.EventId,
            gameEvent.GameId, gameEvent.Sequence, gameEvent.OccurredAt, eventType = gameEvent.Type, gameEvent.Data, state = gameEvent.State }, json);
        foreach (var item in response.Items)
        {
            var connectionId = item["GSI1SK"].S["CONNECTION#".Length..];
            try { await SendBytesAsync(connectionId, payload, cancellationToken); }
            catch when (!cancellationToken.IsCancellationRequested)
            {
                // The durable event remains replayable; one failed connection
                // must not prevent delivery attempts to the remaining listeners.
            }
        }
    }

    private async Task SendBytesAsync(string connectionId, byte[] payload, CancellationToken token)
    {
        try
        {
            await management.PostToConnectionAsync(new PostToConnectionRequest
            { ConnectionId = connectionId, Data = new MemoryStream(payload, writable: false) }, token);
        }
        catch (GoneException)
        {
            await DisconnectAsync(connectionId, token);
        }
    }

    private static string ConnectionPk(string id) => $"CONNECTION#{id}";
    private static string GamePk(string id) => $"GAME#{id}";
    private static string GameSk(string id) => $"GAME#{id}";
    private static AttributeValue S(string value) => new() { S = value };
    private static AttributeValue N(long value) => new() { N = value.ToString(CultureInfo.InvariantCulture) };
}

internal sealed class AwsRuntime
{
    private static readonly Lazy<AwsRuntime> instance = new(Create);
    public static AwsRuntime Instance => instance.Value;
    public MultiplayerService Service { get; init; } = null!;
    public DynamoWebSocketAdapter WebSockets { get; init; } = null!;

    private static AwsRuntime Create()
    {
        var configuration = new ConfigurationBuilder().AddEnvironmentVariables().Build();
        var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        json.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        var dynamo = new AmazonDynamoDBClient();
        var management = new AmazonApiGatewayManagementApiClient(new AmazonApiGatewayManagementApiConfig
        { ServiceURL = configuration["WEBSOCKET_MANAGEMENT_ENDPOINT"] ?? throw new InvalidOperationException("WEBSOCKET_MANAGEMENT_ENDPOINT is required.") });
        var store = new DynamoGameStore(dynamo, configuration, json);
        var webSockets = new DynamoWebSocketAdapter(dynamo, management, configuration, json);
        var capabilities = new CryptographicCapabilityProvider();
        return new AwsRuntime { WebSockets = webSockets, Service = new MultiplayerService(store, webSockets,
            TimeProvider.System, new GuidIdentifierGenerator(), capabilities, capabilities) };
    }
}
