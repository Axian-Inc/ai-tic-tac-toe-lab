using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.ApiGatewayManagementApi;
using Amazon.ApiGatewayManagementApi.Model;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Runtime;
using Microsoft.Extensions.Configuration;
using TicTacToe.Api.Application;
using TicTacToe.Api.Domain;

namespace TicTacToe.Api.Tests;

public sealed class ProductionAdapterTests
{
    [Fact]
    public async Task Create_uses_one_transaction_for_capacity_state_event_and_receipt()
    {
        var client = new RecordingDynamoClient();
        var store = Store(client);
        var now = DateTimeOffset.Parse("2026-08-31T20:15:30Z");
        var game = GameState.Create("game-1", "hash", now);
        var gameEvent = new GameEvent(1, "event-1", game.Id, 1, "game.created", now,
            new Dictionary<string, object?> { ["creator"] = "X" }, game.Snapshot());
        var response = new SeatSession(game.Snapshot(), gameEvent, Mark.X, "token");
        var receipt = new CommandReceipt(Guid.NewGuid(), "request-hash", 201, response);

        var result = await store.CreateAsync(new CreateCommit(game, gameEvent, receipt), default);

        Assert.Equal(CommitStatus.Accepted, result.Status);
        var transaction = Assert.Single(client.Transactions);
        Assert.Equal(4, transaction.TransactItems.Count);
        var capacity = Assert.Single(transaction.TransactItems, item => item.Update is not null).Update;
        Assert.Contains("Held < :limit", capacity.ConditionExpression);
        Assert.Equal("25", capacity.ExpressionAttributeValues[":limit"].N);
        Assert.Equal(3, transaction.TransactItems.Count(item => item.Put is not null));
    }

    [Fact]
    public async Task Reconciliation_brackets_a_consistent_scan_with_capacity_version_reads()
    {
        var client = new RecordingDynamoClient();
        var game = GameState.Create("game-1", "hash", DateTimeOffset.UtcNow);
        client.ScanItems.Add(new Dictionary<string, AttributeValue>
        { ["Payload"] = new() { S = JsonSerializer.Serialize(game, Json()) } });

        var report = await Store(client).ReportAsync(default);

        Assert.Equal(2, client.CapacityReads);
        Assert.NotNull(client.LastScan);
        Assert.True(client.LastScan!.ConsistentRead);
        Assert.Equal(1, report.ExpectedCapacity);
        Assert.True(report.IsConsistent);
    }

    [Fact]
    public async Task Websocket_broadcaster_queries_durable_subscriptions_and_sends_game_event()
    {
        var dynamo = new RecordingDynamoClient();
        dynamo.QueryItems.Add(new Dictionary<string, AttributeValue>
        { ["GSI1SK"] = new() { S = "CONNECTION#connection-1" } });
        var management = new RecordingManagementClient();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        { ["CONNECTION_TABLE_NAME"] = "connections", ["GAME_SUBSCRIPTIONS_INDEX_NAME"] = "GameSubscriptions" }).Build();
        var game = GameState.Create("game-1", "hash", DateTimeOffset.UtcNow);
        var gameEvent = new GameEvent(1, "event-1", game.Id, 1, "game.created", game.CreatedAt,
            new Dictionary<string, object?>(), game.Snapshot());

        await new DynamoWebSocketAdapter(dynamo, management, configuration, Json()).PublishAsync(gameEvent, default);

        Assert.Equal("GameSubscriptions", dynamo.LastQuery?.IndexName);
        var sent = Assert.Single(management.Posts);
        Assert.Equal("connection-1", sent.ConnectionId);
        using var reader = new StreamReader(sent.Data);
        var payload = await reader.ReadToEndAsync();
        Assert.Contains("\"type\":\"game.event\"", payload);
        Assert.Contains("\"eventType\":\"game.created\"", payload);
    }

    private static DynamoGameStore Store(IAmazonDynamoDB client) => new(client,
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["GAME_TABLE_NAME"] = "games", ["GAME_STATUS_INDEX_NAME"] = "StatusIndex",
            ["CAPACITY_PARTITION_KEY"] = "CAPACITY#GLOBAL", ["CAPACITY_SORT_KEY"] = "CAPACITY#GLOBAL",
            ["GAME_CAPACITY_LIMIT"] = "25"
        }).Build(), Json());

    private static JsonSerializerOptions Json()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        return options;
    }

    private sealed class RecordingDynamoClient : AmazonDynamoDBClient
    {
        public RecordingDynamoClient() : base(new AnonymousAWSCredentials(),
            new AmazonDynamoDBConfig { ServiceURL = "http://localhost" }) { }

        public List<TransactWriteItemsRequest> Transactions { get; } = [];
        public List<Dictionary<string, AttributeValue>> ScanItems { get; } = [];
        public List<Dictionary<string, AttributeValue>> QueryItems { get; } = [];
        public ScanRequest? LastScan { get; private set; }
        public QueryRequest? LastQuery { get; private set; }
        public int CapacityReads { get; private set; }

        public override Task<GetItemResponse> GetItemAsync(GetItemRequest request, CancellationToken cancellationToken = default)
        {
            if (request.Key["PK"].S == "CAPACITY#GLOBAL")
            {
                CapacityReads++;
                return Task.FromResult(new GetItemResponse { Item = new()
                { ["Held"] = new() { N = "1" }, ["Version"] = new() { N = "5" } } });
            }
            return Task.FromResult(new GetItemResponse { Item = [] });
        }

        public override Task<TransactWriteItemsResponse> TransactWriteItemsAsync(
            TransactWriteItemsRequest request, CancellationToken cancellationToken = default)
        {
            Transactions.Add(request);
            return Task.FromResult(new TransactWriteItemsResponse());
        }

        public override Task<ScanResponse> ScanAsync(ScanRequest request, CancellationToken cancellationToken = default)
        {
            LastScan = request;
            return Task.FromResult(new ScanResponse { Items = ScanItems, LastEvaluatedKey = [] });
        }

        public override Task<QueryResponse> QueryAsync(QueryRequest request, CancellationToken cancellationToken = default)
        {
            LastQuery = request;
            return Task.FromResult(new QueryResponse { Items = QueryItems, LastEvaluatedKey = [] });
        }
    }

    private sealed class RecordingManagementClient : AmazonApiGatewayManagementApiClient
    {
        public RecordingManagementClient() : base(new AnonymousAWSCredentials(),
            new AmazonApiGatewayManagementApiConfig { ServiceURL = "http://localhost" }) { }

        public List<PostToConnectionRequest> Posts { get; } = [];

        public override Task<PostToConnectionResponse> PostToConnectionAsync(
            PostToConnectionRequest request, CancellationToken cancellationToken = default)
        {
            Posts.Add(request);
            return Task.FromResult(new PostToConnectionResponse());
        }
    }
}
