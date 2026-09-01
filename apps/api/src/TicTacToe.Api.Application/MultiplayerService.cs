using System.Security.Cryptography;
using System.Text;
using TicTacToe.Api.Domain;

namespace TicTacToe.Api.Application;

public sealed record CreateGameCommand(Guid CommandId);
public record SequencedCommand(Guid CommandId, long ExpectedSequence);
public sealed record MoveCommand(Guid CommandId, long ExpectedSequence, int Cell) : SequencedCommand(CommandId, ExpectedSequence);

public sealed record GameEvent(
    int Version,
    string EventId,
    string GameId,
    long Sequence,
    string Type,
    DateTimeOffset OccurredAt,
    IReadOnlyDictionary<string, object?> Data,
    GameSnapshot State);

public record CommandResult(GameSnapshot Game, GameEvent Event);
public sealed record SeatSession(GameSnapshot Game, GameEvent Event, Mark Mark, string SeatToken) : CommandResult(Game, Event);
public sealed record GameList(IReadOnlyList<GameSnapshot> Items, string? NextCursor, string Consistency = "eventual");
public sealed record EventPage(IReadOnlyList<GameEvent> Items, string? NextCursor, long ThroughSequence);

public sealed record CommandReceipt(Guid CommandId, string RequestHash, int StatusCode, object Response);
public sealed record CreateCommit(GameState Game, GameEvent Event, CommandReceipt Receipt);
public sealed record MutationCommit(string GameId, long ExpectedSequence, GameState Game, GameEvent Event, CommandReceipt Receipt, bool ReleaseCapacity);

public enum CommitStatus { Accepted, Duplicate, IdempotencyConflict, CapacityExceeded, NotFound, StaleSequence }
public sealed record CommitResult(CommitStatus Status, CommandReceipt? Receipt = null, long? CurrentSequence = null);

public interface IGameStore
{
    Task<CommandReceipt?> GetReceiptAsync(Guid commandId, CancellationToken cancellationToken);
    Task<GameState?> GetGameAsync(string gameId, CancellationToken cancellationToken);
    Task<CommitResult> CreateAsync(CreateCommit commit, CancellationToken cancellationToken);
    Task<CommitResult> CommitAsync(MutationCommit commit, CancellationToken cancellationToken);
    Task<GameList> ListAsync(GameStatus status, string? cursor, int limit, CancellationToken cancellationToken);
    Task<EventPage> GetEventsAsync(string gameId, long afterSequence, string? cursor, int limit, CancellationToken cancellationToken);
}

public interface IGameBroadcaster
{
    Task PublishAsync(GameEvent gameEvent, CancellationToken cancellationToken);
}

public sealed record CapacityReconciliationReport(
    long SnapshotVersion,
    int StoredCapacity,
    int ExpectedCapacity,
    bool IsConsistent,
    bool Applied = false);

public interface ICapacityReconciler
{
    Task<CapacityReconciliationReport> ReportAsync(CancellationToken cancellationToken);
    Task<CapacityReconciliationReport> RepairAsync(
        long expectedSnapshotVersion,
        int expectedStoredCapacity,
        CancellationToken cancellationToken);
}

public interface IIdentifierGenerator { string NewId(); }
public interface ICapabilityGenerator { string NewToken(); }
public interface ICapabilityHasher { string Hash(string token); bool Matches(string token, string hash); }

public sealed class MultiplayerService(
    IGameStore store,
    IGameBroadcaster broadcaster,
    TimeProvider timeProvider,
    IIdentifierGenerator identifiers,
    ICapabilityGenerator capabilities,
    ICapabilityHasher capabilityHasher)
{
    public async Task<SeatSession> CreateAsync(CreateGameCommand command, CancellationToken cancellationToken = default)
    {
        ValidateCommandId(command.CommandId);
        var requestHash = RequestHash("POST", "/api/v1/games", command.CommandId);
        var replay = await ReplayAsync<SeatSession>(command.CommandId, requestHash, cancellationToken);
        if (replay is not null) return replay;

        var now = UtcNow();
        var gameId = identifiers.NewId();
        var token = capabilities.NewToken();
        var game = GameState.Create(gameId, capabilityHasher.Hash(token), now);
        var gameEvent = Event(game, "game.created", now, new Dictionary<string, object?> { ["creator"] = "X" });
        var response = new SeatSession(game.Snapshot(), gameEvent, Mark.X, token);
        var receipt = new CommandReceipt(command.CommandId, requestHash, 201, response);
        var result = await store.CreateAsync(new CreateCommit(game, gameEvent, receipt), cancellationToken);
        if (result.Status == CommitStatus.CapacityExceeded) throw GameRuleException.Capacity();
        if (result.Status is CommitStatus.Duplicate or CommitStatus.IdempotencyConflict)
            return ResolveCommitReplay<SeatSession>(result, requestHash);
        EnsureAccepted(result);
        await PublishBestEffortAsync(gameEvent, cancellationToken);
        return response;
    }

    public async Task<SeatSession> JoinAsync(string gameId, SequencedCommand command, CancellationToken cancellationToken = default)
    {
        Validate(gameId, command);
        var requestHash = RequestHash("POST", $"/api/v1/games/{gameId}/join", command.CommandId, command.ExpectedSequence);
        var replay = await ReplayAsync<SeatSession>(command.CommandId, requestHash, cancellationToken);
        if (replay is not null) return replay;
        var original = await RequiredGameAsync(gameId, cancellationToken);
        CheckSequence(original, command.ExpectedSequence);
        var token = capabilities.NewToken();
        var now = UtcNow();
        var updated = original.Join(capabilityHasher.Hash(token), now);
        var gameEvent = Event(updated, "player.joined", now, new Dictionary<string, object?> { ["player"] = "O" });
        var response = new SeatSession(updated.Snapshot(), gameEvent, Mark.O, token);
        return await CommitAsync(original, updated, gameEvent,
            new CommandReceipt(command.CommandId, requestHash, 200, response), response, false, cancellationToken);
    }

    public async Task<CommandResult> MoveAsync(string gameId, string? bearerToken, MoveCommand command, CancellationToken cancellationToken = default)
    {
        Validate(gameId, command);
        if (command.Cell is < 0 or > 8) throw GameRuleException.Invalid("The cell must be from 0 through 8.");
        var callerHash = capabilityHasher.Hash(RequiredToken(bearerToken));
        var requestHash = RequestHash("POST", $"/api/v1/games/{gameId}/moves", command.CommandId, command.ExpectedSequence, command.Cell, callerHash);
        var replay = await ReplayAsync<CommandResult>(command.CommandId, requestHash, cancellationToken);
        if (replay is not null) return replay;
        var original = await RequiredGameAsync(gameId, cancellationToken);
        var player = ResolvePlayer(original, bearerToken!);
        CheckSequence(original, command.ExpectedSequence);
        var now = UtcNow();
        var updated = original.Move(player, command.Cell, now);
        var move = updated.Moves[^1];
        var gameEvent = Event(updated, "move.accepted", now, new Dictionary<string, object?>
            { ["player"] = player.ToString(), ["cell"] = command.Cell, ["ply"] = move.Ply });
        var response = new CommandResult(updated.Snapshot(), gameEvent);
        return await CommitAsync(original, updated, gameEvent,
            new CommandReceipt(command.CommandId, requestHash, 200, response), response, !updated.CapacityHeld, cancellationToken);
    }

    public Task<CommandResult> ResignAsync(string gameId, string? bearerToken, SequencedCommand command, CancellationToken cancellationToken = default) =>
        MutateWithCapabilityAsync(gameId, bearerToken, command, "resign", (state, player, now) => state.Resign(player, now), cancellationToken);

    public Task<CommandResult> CheckAbandonmentAsync(string gameId, string? bearerToken, SequencedCommand command, CancellationToken cancellationToken = default) =>
        MutateWithCapabilityAsync(gameId, bearerToken, command, "abandonment-check", (state, player, now) => state.Abandon(player, now), cancellationToken);

    public async Task<GameSnapshot> GetAsync(string gameId, CancellationToken cancellationToken = default) =>
        (await RequiredGameAsync(gameId, cancellationToken)).Snapshot();

    public Task<GameList> ListAsync(GameStatus status, string? cursor, int limit, CancellationToken cancellationToken = default)
    {
        if (limit is < 1 or > 100) throw GameRuleException.Invalid("The list limit must be from 1 through 100.");
        return store.ListAsync(status, cursor, limit, cancellationToken);
    }

    public async Task<EventPage> GetEventsAsync(string gameId, long afterSequence, string? cursor, int limit, CancellationToken cancellationToken = default)
    {
        if (afterSequence < 0 || limit is < 1 or > 500) throw GameRuleException.Invalid("The event cursor or limit is invalid.");
        var game = await RequiredGameAsync(gameId, cancellationToken);
        if (afterSequence > game.Sequence) throw GameRuleException.Conflict("invalid_cursor", "afterSequence exceeds the current game sequence.");
        return await store.GetEventsAsync(gameId, afterSequence, cursor, limit, cancellationToken);
    }

    private async Task<CommandResult> MutateWithCapabilityAsync(string gameId, string? bearerToken, SequencedCommand command,
        string action, Func<GameState, Mark, DateTimeOffset, GameState> mutate, CancellationToken cancellationToken)
    {
        Validate(gameId, command);
        var callerHash = capabilityHasher.Hash(RequiredToken(bearerToken));
        var requestHash = RequestHash("POST", $"/api/v1/games/{gameId}/{action}", command.CommandId, command.ExpectedSequence, callerHash);
        var replay = await ReplayAsync<CommandResult>(command.CommandId, requestHash, cancellationToken);
        if (replay is not null) return replay;
        var original = await RequiredGameAsync(gameId, cancellationToken);
        var player = ResolvePlayer(original, bearerToken!);
        CheckSequence(original, command.ExpectedSequence);
        var now = UtcNow();
        var updated = mutate(original, player, now);
        var isCancellation = updated.EndReason == EndReason.Cancelled;
        var eventType = action == "resign" ? (isCancellation ? "game.cancelled" : "game.resigned") : "game.abandoned";
        var gameEvent = Event(updated, eventType, now, new Dictionary<string, object?>
            { [isCancellation ? "creator" : action == "resign" ? "resigningPlayer" : "winner"] = player.ToString() });
        var response = new CommandResult(updated.Snapshot(), gameEvent);
        return await CommitAsync(original, updated, gameEvent,
            new CommandReceipt(command.CommandId, requestHash, 200, response), response, true, cancellationToken);
    }

    private async Task<T> CommitAsync<T>(GameState original, GameState updated, GameEvent gameEvent,
        CommandReceipt receipt, T response, bool releaseCapacity, CancellationToken cancellationToken) where T : CommandResult
    {
        var result = await store.CommitAsync(new MutationCommit(original.Id, original.Sequence, updated, gameEvent, receipt, releaseCapacity), cancellationToken);
        if (result.Status is CommitStatus.Duplicate or CommitStatus.IdempotencyConflict)
            return ResolveCommitReplay<T>(result, receipt.RequestHash);
        if (result.Status == CommitStatus.NotFound) throw GameRuleException.NotFound();
        if (result.Status == CommitStatus.StaleSequence) throw GameRuleException.Stale(result.CurrentSequence ?? original.Sequence);
        EnsureAccepted(result);
        await PublishBestEffortAsync(gameEvent, cancellationToken);
        return response;
    }

    private async Task<T?> ReplayAsync<T>(Guid commandId, string requestHash, CancellationToken cancellationToken) where T : class
    {
        var receipt = await store.GetReceiptAsync(commandId, cancellationToken);
        if (receipt is null) return null;
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(receipt.RequestHash), Encoding.UTF8.GetBytes(requestHash)))
            throw GameRuleException.Conflict("idempotency_conflict", "The commandId was already used for another request.");
        return receipt.Response as T ?? throw new InvalidOperationException("The stored receipt response type is invalid.");
    }

    private static T ResolveCommitReplay<T>(CommitResult result, string requestHash) where T : class
    {
        if (result.Receipt is null || result.Receipt.RequestHash != requestHash)
            throw GameRuleException.Conflict("idempotency_conflict", "The commandId was already used for another request.");
        return result.Receipt.Response as T ?? throw new InvalidOperationException("The stored receipt response type is invalid.");
    }

    private async Task<GameState> RequiredGameAsync(string gameId, CancellationToken cancellationToken) =>
        await store.GetGameAsync(gameId, cancellationToken) ?? throw GameRuleException.NotFound();

    private Mark ResolvePlayer(GameState game, string token)
    {
        if (capabilityHasher.Matches(token, game.XCapabilityHash)) return Mark.X;
        if (game.OCapabilityHash is not null && capabilityHasher.Matches(token, game.OCapabilityHash)) return Mark.O;
        throw GameRuleException.Unauthorized();
    }

    private static void CheckSequence(GameState game, long expected)
    {
        if (game.Status == GameStatus.Over) throw GameRuleException.Conflict("game_over", "The game is already over.");
        if (game.Sequence != expected) throw GameRuleException.Stale(game.Sequence);
    }

    private static void Validate(string gameId, SequencedCommand command)
    {
        if (string.IsNullOrWhiteSpace(gameId) || gameId.Length > 64) throw GameRuleException.Invalid("The gameId is invalid.");
        ValidateCommandId(command.CommandId);
        if (command.ExpectedSequence < 1) throw GameRuleException.Invalid("expectedSequence must be positive.");
    }

    private static void ValidateCommandId(Guid commandId)
    {
        if (commandId == Guid.Empty) throw GameRuleException.Invalid("commandId must be a non-empty UUID.");
    }

    private static string RequiredToken(string? token) => string.IsNullOrWhiteSpace(token) ? throw GameRuleException.Unauthorized() : token;
    private DateTimeOffset UtcNow() => timeProvider.GetUtcNow().ToUniversalTime();
    private GameEvent Event(GameState game, string type, DateTimeOffset now, IReadOnlyDictionary<string, object?> data) =>
        new(1, identifiers.NewId(), game.Id, game.Sequence, type, now, data, game.Snapshot());

    private async Task PublishBestEffortAsync(GameEvent gameEvent, CancellationToken cancellationToken)
    {
        try { await broadcaster.PublishAsync(gameEvent, cancellationToken); }
        catch when (!cancellationToken.IsCancellationRequested) { /* durable replay is the recovery path */ }
    }

    private static string RequestHash(params object[] parts)
    {
        var canonical = string.Join('|', parts.Select(value => value switch
        {
            Guid id => id.ToString("D"),
            null => "null",
            _ => value.ToString()
        }));
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
    }

    private static void EnsureAccepted(CommitResult result)
    {
        if (result.Status != CommitStatus.Accepted) throw new InvalidOperationException($"Unexpected persistence result: {result.Status}.");
    }
}

public sealed class CryptographicCapabilityProvider : ICapabilityGenerator, ICapabilityHasher
{
    public string NewToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        .TrimEnd('=').Replace('+', '-').Replace('/', '_');

    public string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public bool Matches(string token, string hash)
    {
        var candidate = Hash(token);
        return candidate.Length == hash.Length && CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(candidate), Encoding.ASCII.GetBytes(hash));
    }
}

public sealed class GuidIdentifierGenerator : IIdentifierGenerator
{
    public string NewId() => Guid.NewGuid().ToString("N");
}
