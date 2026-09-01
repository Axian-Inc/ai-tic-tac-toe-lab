using TicTacToe.Api.Application;
using TicTacToe.Api.Domain;

namespace TicTacToe.Api.Tests;

public sealed class MultiplayerServiceTests
{
    [Fact]
    public async Task Create_join_and_winning_moves_preserve_order_and_release_capacity()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(new(Guid.NewGuid()));
        Assert.Equal(GameStatus.Waiting, created.Game.Status);
        Assert.Equal(1, created.Game.Sequence);
        var joined = await fixture.Service.JoinAsync(created.Game.Id, new(Guid.NewGuid(), 1));
        Assert.Equal(Mark.O, joined.Mark);
        Assert.Equal(Mark.X, joined.Game.CurrentTurn);

        var state = (CommandResult)joined;
        foreach (var (token, cell) in new[]
        {
            (created.SeatToken, 0), (joined.SeatToken, 1), (created.SeatToken, 3),
            (joined.SeatToken, 2), (created.SeatToken, 6)
        })
        {
            state = await fixture.Service.MoveAsync(created.Game.Id, token, new(Guid.NewGuid(), state.Game.Sequence, cell));
        }

        Assert.Equal(GameStatus.Over, state.Game.Status);
        Assert.Equal(Mark.X, state.Game.Winner);
        Assert.Equal(EndReason.Line, state.Game.EndReason);
        Assert.Equal(Enumerable.Range(1, 5), state.Game.Moves.Select(move => move.Ply));
        Assert.Equal("move.accepted", state.Event.Type);

        // The released slot admits another game.
        for (var index = 0; index < 25; index++) await fixture.Service.CreateAsync(new(Guid.NewGuid()));
    }

    [Fact]
    public async Task Accepted_retry_returns_receipt_without_event_or_sequence_change()
    {
        var fixture = new Fixture();
        var command = new CreateGameCommand(Guid.NewGuid());
        var first = await fixture.Service.CreateAsync(command);
        var retry = await fixture.Service.CreateAsync(command);
        Assert.Same(first, retry);
        Assert.Single(fixture.Broadcaster.Events);
        Assert.Equal(1, (await fixture.Service.GetAsync(first.Game.Id)).Sequence);
    }

    [Fact]
    public async Task Reusing_command_id_with_different_request_is_rejected()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(new(Guid.NewGuid()));
        var id = Guid.NewGuid();
        await fixture.Service.JoinAsync(created.Game.Id, new(id, 1));
        var exception = await Assert.ThrowsAsync<GameRuleException>(() => fixture.Service.JoinAsync(created.Game.Id, new(id, 2)));
        Assert.Equal("idempotency_conflict", exception.Code);
    }

    [Fact]
    public async Task Abandonment_uses_server_time_and_accepts_exact_boundary()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(new(Guid.NewGuid()));
        var joined = await fixture.Service.JoinAsync(created.Game.Id, new(Guid.NewGuid(), 1));
        fixture.Clock.Advance(TimeSpan.FromSeconds(179.999));
        var early = await Assert.ThrowsAsync<GameRuleException>(() => fixture.Service.CheckAbandonmentAsync(
            created.Game.Id, joined.SeatToken, new(Guid.NewGuid(), joined.Game.Sequence)));
        Assert.Equal("abandonment_not_due", early.Code);
        fixture.Clock.Advance(TimeSpan.FromMilliseconds(1));
        var result = await fixture.Service.CheckAbandonmentAsync(created.Game.Id, joined.SeatToken,
            new(Guid.NewGuid(), joined.Game.Sequence));
        Assert.Equal(Mark.O, result.Game.Winner);
        Assert.Equal(EndReason.Abandonment, result.Game.EndReason);
    }

    [Fact]
    public async Task Concurrent_create_atomically_rejects_every_request_after_twenty_five()
    {
        var fixture = new Fixture();
        var tasks = Enumerable.Range(0, 40).Select(async _ =>
        {
            try { await fixture.Service.CreateAsync(new(Guid.NewGuid())); return "accepted"; }
            catch (GameRuleException exception) { return exception.Code; }
        });
        var results = await Task.WhenAll(tasks);
        Assert.Equal(25, results.Count(result => result == "accepted"));
        Assert.Equal(15, results.Count(result => result == "capacity_exhausted"));
    }

    [Fact]
    public async Task Waiting_creator_can_cancel_and_joiner_capability_is_game_scoped()
    {
        var fixture = new Fixture();
        var first = await fixture.Service.CreateAsync(new(Guid.NewGuid()));
        var second = await fixture.Service.CreateAsync(new(Guid.NewGuid()));
        var joined = await fixture.Service.JoinAsync(first.Game.Id, new(Guid.NewGuid(), 1));
        var invalid = await Assert.ThrowsAsync<GameRuleException>(() => fixture.Service.MoveAsync(second.Game.Id,
            joined.SeatToken, new(Guid.NewGuid(), second.Game.Sequence, 0)));
        Assert.Equal("invalid_capability", invalid.Code);
        var cancelled = await fixture.Service.ResignAsync(second.Game.Id, second.SeatToken, new(Guid.NewGuid(), second.Game.Sequence));
        Assert.Equal(EndReason.Cancelled, cancelled.Game.EndReason);
        Assert.Null(cancelled.Game.Winner);
        Assert.Equal("game.cancelled", cancelled.Event.Type);
    }

    [Fact]
    public async Task Capacity_reconciliation_requires_the_reported_stable_snapshot()
    {
        var store = new InMemoryGameStore();
        var capabilities = new CryptographicCapabilityProvider();
        var service = new MultiplayerService(store, new NullGameBroadcaster(), TimeProvider.System,
            new GuidIdentifierGenerator(), capabilities, capabilities);
        var report = await store.ReportAsync(default);
        await service.CreateAsync(new(Guid.NewGuid()));

        var exception = await Assert.ThrowsAsync<GameRuleException>(() =>
            store.RepairAsync(report.SnapshotVersion, report.StoredCapacity, default));

        Assert.Equal("capacity_snapshot_changed", exception.Code);
        var current = await store.ReportAsync(default);
        var applied = await store.RepairAsync(current.SnapshotVersion, current.StoredCapacity, default);
        Assert.True(applied.Applied);
        Assert.True(applied.IsConsistent);
    }

    private sealed class Fixture
    {
        public FakeTimeProvider Clock { get; } = new(new DateTimeOffset(2026, 8, 31, 12, 0, 0, TimeSpan.Zero));
        public CapturingBroadcaster Broadcaster { get; } = new();
        public MultiplayerService Service { get; }

        public Fixture()
        {
            var capabilities = new CryptographicCapabilityProvider();
            Service = new MultiplayerService(new InMemoryGameStore(), Broadcaster, Clock,
                new GuidIdentifierGenerator(), capabilities, capabilities);
        }
    }

    private sealed class CapturingBroadcaster : IGameBroadcaster
    {
        public List<GameEvent> Events { get; } = [];
        public Task PublishAsync(GameEvent gameEvent, CancellationToken cancellationToken) { Events.Add(gameEvent); return Task.CompletedTask; }
    }

    public sealed class FakeTimeProvider(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset current = now;
        public override DateTimeOffset GetUtcNow() => current;
        public void Advance(TimeSpan duration) => current += duration;
    }
}
