using System.Text;
using TicTacToe.Api.Domain;

namespace TicTacToe.Api.Application;

/// <summary>
/// Atomic local/test adapter. Production must replace this with a durable adapter
/// that honors the same transaction boundaries.
/// </summary>
public sealed class InMemoryGameStore : IGameStore, ICapacityReconciler
{
    private readonly Lock gate = new();
    private readonly Dictionary<string, GameState> games = new(StringComparer.Ordinal);
    private readonly Dictionary<string, List<GameEvent>> events = new(StringComparer.Ordinal);
    private readonly Dictionary<Guid, CommandReceipt> receipts = [];
    private int capacityHeld;
    private long snapshotVersion;

    public Task<CommandReceipt?> GetReceiptAsync(Guid commandId, CancellationToken cancellationToken)
    {
        lock (gate) return Task.FromResult(receipts.GetValueOrDefault(commandId));
    }

    public Task<GameState?> GetGameAsync(string gameId, CancellationToken cancellationToken)
    {
        lock (gate) return Task.FromResult(games.GetValueOrDefault(gameId));
    }

    public Task<CommitResult> CreateAsync(CreateCommit commit, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            var duplicate = ReceiptResult(commit.Receipt);
            if (duplicate is not null) return Task.FromResult(duplicate);
            if (capacityHeld >= 25) return Task.FromResult(new CommitResult(CommitStatus.CapacityExceeded));
            if (games.ContainsKey(commit.Game.Id)) throw new InvalidOperationException("The generated game ID already exists.");
            games.Add(commit.Game.Id, commit.Game);
            events.Add(commit.Game.Id, [commit.Event]);
            receipts.Add(commit.Receipt.CommandId, commit.Receipt);
            capacityHeld++;
            snapshotVersion++;
            return Task.FromResult(new CommitResult(CommitStatus.Accepted));
        }
    }

    public Task<CommitResult> CommitAsync(MutationCommit commit, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            var duplicate = ReceiptResult(commit.Receipt);
            if (duplicate is not null) return Task.FromResult(duplicate);
            if (!games.TryGetValue(commit.GameId, out var current))
                return Task.FromResult(new CommitResult(CommitStatus.NotFound));
            if (current.Sequence != commit.ExpectedSequence)
                return Task.FromResult(new CommitResult(CommitStatus.StaleSequence, CurrentSequence: current.Sequence));
            if (commit.ReleaseCapacity && (!current.CapacityHeld || commit.Game.CapacityHeld))
                throw new InvalidOperationException("A capacity release must transition capacityHeld from true to false.");

            games[commit.GameId] = commit.Game;
            events[commit.GameId].Add(commit.Event);
            receipts.Add(commit.Receipt.CommandId, commit.Receipt);
            if (commit.ReleaseCapacity) capacityHeld--;
            snapshotVersion++;
            return Task.FromResult(new CommitResult(CommitStatus.Accepted));
        }
    }

    public Task<GameList> ListAsync(GameStatus status, string? cursor, int limit, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            var afterId = DecodeCursor(cursor);
            var matches = games.Values.Where(game => game.Status == status)
                .OrderBy(game => game.Id, StringComparer.Ordinal)
                .Where(game => afterId is null || string.CompareOrdinal(game.Id, afterId) > 0)
                .Take(limit + 1).ToArray();
            var page = matches.Take(limit).Select(game => game.Snapshot()).ToArray();
            var next = matches.Length > limit ? EncodeCursor(page[^1].Id) : null;
            return Task.FromResult(new GameList(page, next));
        }
    }

    public Task<EventPage> GetEventsAsync(string gameId, long afterSequence, string? cursor, int limit, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            if (!games.TryGetValue(gameId, out var game)) throw GameRuleException.NotFound();
            var cursorSequence = cursor is null ? afterSequence : DecodeSequenceCursor(cursor);
            if (cursorSequence < afterSequence || cursorSequence > game.Sequence)
                throw GameRuleException.Conflict("invalid_cursor", "The event cursor is outside the requested range.");
            var matches = events[gameId].Where(item => item.Sequence > cursorSequence).Take(limit + 1).ToArray();
            var page = matches.Take(limit).ToArray();
            var next = matches.Length > limit ? EncodeCursor(page[^1].Sequence.ToString()) : null;
            return Task.FromResult(new EventPage(page, next, game.Sequence));
        }
    }

    public Task<CapacityReconciliationReport> ReportAsync(CancellationToken cancellationToken)
    {
        lock (gate)
        {
            var expected = games.Values.Count(game => game.CapacityHeld && game.Status is GameStatus.Waiting or GameStatus.Active);
            return Task.FromResult(new CapacityReconciliationReport(
                snapshotVersion, capacityHeld, expected, capacityHeld == expected));
        }
    }

    public Task<CapacityReconciliationReport> RepairAsync(
        long expectedSnapshotVersion,
        int expectedStoredCapacity,
        CancellationToken cancellationToken)
    {
        lock (gate)
        {
            if (snapshotVersion != expectedSnapshotVersion || capacityHeld != expectedStoredCapacity)
                throw GameRuleException.Conflict("capacity_snapshot_changed", "Capacity changed after the reconciliation report was generated.");
            var expected = games.Values.Count(game => game.CapacityHeld && game.Status is GameStatus.Waiting or GameStatus.Active);
            capacityHeld = expected;
            snapshotVersion++;
            return Task.FromResult(new CapacityReconciliationReport(
                snapshotVersion, capacityHeld, expected, true, true));
        }
    }

    private CommitResult? ReceiptResult(CommandReceipt candidate)
    {
        if (!receipts.TryGetValue(candidate.CommandId, out var existing)) return null;
        return new CommitResult(existing.RequestHash == candidate.RequestHash ? CommitStatus.Duplicate : CommitStatus.IdempotencyConflict, existing);
    }

    private static string EncodeCursor(string value) => Convert.ToBase64String(Encoding.UTF8.GetBytes(value));

    private static string? DecodeCursor(string? cursor)
    {
        if (cursor is null) return null;
        try
        {
            if (cursor.Length is < 1 or > 2048) throw new FormatException();
            return Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
        }
        catch (FormatException)
        {
            throw GameRuleException.Conflict("invalid_cursor", "The cursor is invalid.");
        }
    }

    private static long DecodeSequenceCursor(string cursor)
    {
        var decoded = DecodeCursor(cursor);
        if (!long.TryParse(decoded, out var sequence)) throw GameRuleException.Conflict("invalid_cursor", "The event cursor is invalid.");
        return sequence;
    }
}

public sealed class NullGameBroadcaster : IGameBroadcaster
{
    public Task PublishAsync(GameEvent gameEvent, CancellationToken cancellationToken) => Task.CompletedTask;
}
