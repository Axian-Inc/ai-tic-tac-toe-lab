using System.Globalization;
using System.Text;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using TicTacToe.Api.Application;
using TicTacToe.Api.Domain;

namespace TicTacToe.Api;

/// <summary>Production transaction adapter for aggregates, events, receipts, and capacity.</summary>
public sealed class DynamoGameStore : IGameStore, ICapacityReconciler
{
    private const string StateSortKey = "STATE";
    private readonly IAmazonDynamoDB client;
    private readonly string table;
    private readonly string statusIndex;
    private readonly string capacityPk;
    private readonly string capacitySk;
    private readonly int limit;
    private readonly JsonSerializerOptions json;

    public DynamoGameStore(IAmazonDynamoDB client, IConfiguration configuration, JsonSerializerOptions json)
    {
        this.client = client;
        this.json = json;
        table = Required(configuration, "GAME_TABLE_NAME");
        statusIndex = Required(configuration, "GAME_STATUS_INDEX_NAME");
        capacityPk = Required(configuration, "CAPACITY_PARTITION_KEY");
        capacitySk = Required(configuration, "CAPACITY_SORT_KEY");
        limit = int.Parse(Required(configuration, "GAME_CAPACITY_LIMIT"), CultureInfo.InvariantCulture);
    }

    public async Task<CommandReceipt?> GetReceiptAsync(Guid commandId, CancellationToken cancellationToken)
    {
        var response = await client.GetItemAsync(new GetItemRequest
        {
            TableName = table,
            ConsistentRead = true,
            Key = Key($"COMMAND#{commandId:D}", "RECEIPT")
        }, cancellationToken);
        return response.Item.Count == 0 ? null : ReadReceipt(response.Item);
    }

    public async Task<GameState?> GetGameAsync(string gameId, CancellationToken cancellationToken)
    {
        var response = await client.GetItemAsync(new GetItemRequest
        {
            TableName = table,
            ConsistentRead = true,
            Key = Key(GamePk(gameId), StateSortKey)
        }, cancellationToken);
        return response.Item.Count == 0 ? null : Deserialize<GameState>(response.Item["Payload"].S);
    }

    public async Task<CommitResult> CreateAsync(CreateCommit commit, CancellationToken cancellationToken)
    {
        var existing = await GetReceiptAsync(commit.Receipt.CommandId, cancellationToken);
        if (existing is not null) return ReceiptResult(existing, commit.Receipt);
        var state = StateItem(commit.Game);
        try
        {
            await client.TransactWriteItemsAsync(new TransactWriteItemsRequest
            {
                TransactItems =
                [
                    new() { Update = new Update { TableName = table, Key = Key(capacityPk, capacitySk),
                        UpdateExpression = "ADD Held :one, Version :one",
                        ConditionExpression = "attribute_not_exists(Held) OR Held < :limit",
                        ExpressionAttributeValues = new() { [":one"] = N(1), [":limit"] = N(limit) } } },
                    Put(state, "attribute_not_exists(PK)"),
                    Put(EventItem(commit.Event), "attribute_not_exists(PK)"),
                    Put(ReceiptItem(commit.Receipt), "attribute_not_exists(PK)")
                ]
            }, cancellationToken);
            return new CommitResult(CommitStatus.Accepted);
        }
        catch (TransactionCanceledException)
        {
            existing = await GetReceiptAsync(commit.Receipt.CommandId, cancellationToken);
            return existing is null ? new CommitResult(CommitStatus.CapacityExceeded) : ReceiptResult(existing, commit.Receipt);
        }
    }

    public async Task<CommitResult> CommitAsync(MutationCommit commit, CancellationToken cancellationToken)
    {
        var existing = await GetReceiptAsync(commit.Receipt.CommandId, cancellationToken);
        if (existing is not null) return ReceiptResult(existing, commit.Receipt);
        var state = StateItem(commit.Game);
        var items = new List<TransactWriteItem>
        {
            Put(state, "#sequence = :expected", new() { ["#sequence"] = "Sequence" },
                new() { [":expected"] = N(commit.ExpectedSequence) }),
            Put(EventItem(commit.Event), "attribute_not_exists(PK)"),
            Put(ReceiptItem(commit.Receipt), "attribute_not_exists(PK)")
        };
        if (commit.ReleaseCapacity)
        {
            items.Add(new TransactWriteItem { Update = new Update { TableName = table, Key = Key(capacityPk, capacitySk),
                UpdateExpression = "ADD Held :minusOne, Version :one", ConditionExpression = "Held > :zero",
                ExpressionAttributeValues = new() { [":minusOne"] = N(-1), [":one"] = N(1), [":zero"] = N(0) } } });
        }
        try
        {
            await client.TransactWriteItemsAsync(new TransactWriteItemsRequest { TransactItems = items }, cancellationToken);
            return new CommitResult(CommitStatus.Accepted);
        }
        catch (TransactionCanceledException)
        {
            existing = await GetReceiptAsync(commit.Receipt.CommandId, cancellationToken);
            if (existing is not null) return ReceiptResult(existing, commit.Receipt);
            var current = await GetGameAsync(commit.GameId, cancellationToken);
            return current is null ? new CommitResult(CommitStatus.NotFound) :
                new CommitResult(CommitStatus.StaleSequence, CurrentSequence: current.Sequence);
        }
    }

    public async Task<GameList> ListAsync(GameStatus status, string? cursor, int pageSize, CancellationToken cancellationToken)
    {
        var statusValue = StatusKey(status);
        var request = new QueryRequest { TableName = table, IndexName = statusIndex,
            KeyConditionExpression = "GSI1PK = :status", ExpressionAttributeValues = new() { [":status"] = S(statusValue) },
            Limit = pageSize + 1, ScanIndexForward = true };
        if (cursor is not null)
        {
            var id = Decode(cursor);
            request.ExclusiveStartKey = StateItemKey(id, statusValue);
        }
        var response = await client.QueryAsync(request, cancellationToken);
        var states = response.Items.Take(pageSize).Select(item => Deserialize<GameState>(item["Payload"].S)).ToArray();
        var next = response.Items.Count > pageSize ? Encode(states[^1].Id) : null;
        return new GameList(states.Select(state => state.Snapshot()).ToArray(), next);
    }

    public async Task<EventPage> GetEventsAsync(string gameId, long afterSequence, string? cursor, int pageSize, CancellationToken cancellationToken)
    {
        var decoded = cursor is null ? null : Decode(cursor);
        if (decoded is not null && !long.TryParse(decoded, NumberStyles.None, CultureInfo.InvariantCulture, out _))
            throw GameRuleException.Conflict("invalid_cursor", "The event cursor is invalid.");
        var after = decoded is null ? afterSequence : long.Parse(decoded, CultureInfo.InvariantCulture);
        var response = await client.QueryAsync(new QueryRequest { TableName = table,
            KeyConditionExpression = "PK = :pk AND SK BETWEEN :after AND :end", ExpressionAttributeValues = new()
            { [":pk"] = S(GamePk(gameId)), [":after"] = S($"{EventSk(after)}~"), [":end"] = S("EVENT#~") }, Limit = pageSize + 1 }, cancellationToken);
        var events = response.Items.Take(pageSize).Select(item => Deserialize<GameEvent>(item["Payload"].S)).ToArray();
        var game = await GetGameAsync(gameId, cancellationToken) ?? throw GameRuleException.NotFound();
        return new EventPage(events, response.Items.Count > pageSize ? Encode(events[^1].Sequence.ToString(CultureInfo.InvariantCulture)) : null, game.Sequence);
    }

    public async Task<CapacityReconciliationReport> ReportAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var before = await ReadCapacityAsync(cancellationToken);
            var expected = 0;
            Dictionary<string, AttributeValue>? start = null;
            do
            {
                var page = await client.ScanAsync(new ScanRequest { TableName = table, ConsistentRead = true,
                    FilterExpression = "SK = :state", ExpressionAttributeValues = new() { [":state"] = S(StateSortKey) },
                    ProjectionExpression = "Payload", ExclusiveStartKey = start }, cancellationToken);
                expected += page.Items.Select(item => Deserialize<GameState>(item["Payload"].S))
                    .Count(game => game.CapacityHeld && game.Status is GameStatus.Waiting or GameStatus.Active);
                start = page.LastEvaluatedKey;
            } while (start is { Count: > 0 });
            var after = await ReadCapacityAsync(cancellationToken);
            if (before == after) return new(before.Version, before.Held, expected, before.Held == expected);
        }
        throw GameRuleException.Conflict("capacity_snapshot_changed", "Capacity changed while the stable report was being generated.");
    }

    public async Task<CapacityReconciliationReport> RepairAsync(long expectedSnapshotVersion, int expectedStoredCapacity, CancellationToken cancellationToken)
    {
        var report = await ReportAsync(cancellationToken);
        if (report.SnapshotVersion != expectedSnapshotVersion || report.StoredCapacity != expectedStoredCapacity)
            throw GameRuleException.Conflict("capacity_snapshot_changed", "Capacity changed after the reconciliation report was generated.");
        try
        {
            await client.UpdateItemAsync(new UpdateItemRequest { TableName = table, Key = Key(capacityPk, capacitySk),
                UpdateExpression = "SET Held = :expected ADD Version :one",
                ConditionExpression = "Version = :version AND Held = :stored", ExpressionAttributeValues = new()
                { [":expected"] = N(report.ExpectedCapacity), [":one"] = N(1), [":version"] = N(expectedSnapshotVersion), [":stored"] = N(expectedStoredCapacity) } }, cancellationToken);
            return report with { SnapshotVersion = expectedSnapshotVersion + 1, StoredCapacity = report.ExpectedCapacity, IsConsistent = true, Applied = true };
        }
        catch (ConditionalCheckFailedException)
        {
            throw GameRuleException.Conflict("capacity_snapshot_changed", "Capacity changed before the conditional repair was applied.");
        }
    }

    private async Task<(long Version, int Held)> ReadCapacityAsync(CancellationToken token)
    {
        var result = await client.GetItemAsync(new GetItemRequest { TableName = table, ConsistentRead = true, Key = Key(capacityPk, capacitySk) }, token);
        return result.Item.Count == 0 ? (0, 0) :
            (long.Parse(result.Item["Version"].N, CultureInfo.InvariantCulture), int.Parse(result.Item["Held"].N, CultureInfo.InvariantCulture));
    }

    private Dictionary<string, AttributeValue> StateItem(GameState game) => new()
    { ["PK"] = S(GamePk(game.Id)), ["SK"] = S(StateSortKey), ["Sequence"] = N(game.Sequence),
      ["GSI1PK"] = S(StatusKey(game.Status)), ["GSI1SK"] = S(game.Id), ["Payload"] = S(Serialize(game)) };
    private static Dictionary<string, AttributeValue> StateItemKey(string id, string status) => new()
    { ["PK"] = S(GamePk(id)), ["SK"] = S(StateSortKey), ["GSI1PK"] = S(status), ["GSI1SK"] = S(id) };
    private Dictionary<string, AttributeValue> EventItem(GameEvent item) => new()
    { ["PK"] = S(GamePk(item.GameId)), ["SK"] = S(EventSk(item.Sequence)), ["Payload"] = S(Serialize(item)) };
    private Dictionary<string, AttributeValue> ReceiptItem(CommandReceipt item) => new()
    { ["PK"] = S($"COMMAND#{item.CommandId:D}"), ["SK"] = S("RECEIPT"), ["RequestHash"] = S(item.RequestHash),
      ["StatusCode"] = N(item.StatusCode), ["ResponseType"] = S(item.Response is SeatSession ? "seat" : "command"), ["Payload"] = S(Serialize(item.Response)) };
    private CommandReceipt ReadReceipt(Dictionary<string, AttributeValue> item)
    {
        var response = item["ResponseType"].S == "seat" ? (object)Deserialize<SeatSession>(item["Payload"].S) : Deserialize<CommandResult>(item["Payload"].S);
        var id = Guid.Parse(item["PK"].S[8..]);
        return new(id, item["RequestHash"].S, int.Parse(item["StatusCode"].N, CultureInfo.InvariantCulture), response);
    }
    private TransactWriteItem Put(Dictionary<string, AttributeValue> item, string condition,
        Dictionary<string, string>? names = null, Dictionary<string, AttributeValue>? values = null) => new()
    { Put = new Put { TableName = table, Item = item, ConditionExpression = condition,
        ExpressionAttributeNames = names, ExpressionAttributeValues = values } };
    private static CommitResult ReceiptResult(CommandReceipt existing, CommandReceipt candidate) =>
        new(existing.RequestHash == candidate.RequestHash ? CommitStatus.Duplicate : CommitStatus.IdempotencyConflict, existing);
    private string Serialize<T>(T value) => JsonSerializer.Serialize(value, json);
    private T Deserialize<T>(string value) => JsonSerializer.Deserialize<T>(value, json) ?? throw new InvalidOperationException("Stored payload is invalid.");
    private static string Required(IConfiguration config, string key) => config[key] ?? throw new InvalidOperationException($"{key} is required.");
    private static string GamePk(string id) => $"GAME#{id}";
    private static string EventSk(long sequence) => $"EVENT#{sequence:D20}";
    private static string StatusKey(GameStatus status) => $"STATUS#{status.ToString().ToLowerInvariant()}";
    private static Dictionary<string, AttributeValue> Key(string pk, string sk) => new() { ["PK"] = S(pk), ["SK"] = S(sk) };
    private static AttributeValue S(string value) => new() { S = value };
    private static AttributeValue N(long value) => new() { N = value.ToString(CultureInfo.InvariantCulture) };
    private static string Encode(string value) => Convert.ToBase64String(Encoding.UTF8.GetBytes(value));
    private static string Decode(string value)
    {
        try
        {
            if (value.Length is < 1 or > 2048) throw new FormatException();
            return Encoding.UTF8.GetString(Convert.FromBase64String(value));
        }
        catch (FormatException)
        {
            throw GameRuleException.Conflict("invalid_cursor", "The cursor is invalid.");
        }
    }
}
