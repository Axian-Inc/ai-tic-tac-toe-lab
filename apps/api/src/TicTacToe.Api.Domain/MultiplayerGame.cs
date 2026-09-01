namespace TicTacToe.Api.Domain;

public enum Mark { X, O }
public enum GameStatus { Waiting, Active, Over }
public enum EndReason { Line, Draw, Resignation, Abandonment, Cancelled }

public sealed record GameMove(int Ply, Mark Player, int Cell, DateTimeOffset AcceptedAt);

public sealed record GameSnapshot(
    string Id,
    GameStatus Status,
    long Sequence,
    IReadOnlyList<Mark?> Board,
    IReadOnlyList<GameMove> Moves,
    Mark? CurrentTurn,
    Mark? Winner,
    EndReason? EndReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? TurnStartedAt);

public sealed record GameState(
    string Id,
    GameStatus Status,
    long Sequence,
    IReadOnlyList<Mark?> Board,
    IReadOnlyList<GameMove> Moves,
    Mark? CurrentTurn,
    Mark? Winner,
    EndReason? EndReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? TurnStartedAt,
    string XCapabilityHash,
    string? OCapabilityHash,
    bool CapacityHeld)
{
    public static GameState Create(string id, string xCapabilityHash, DateTimeOffset now) =>
        new(id, GameStatus.Waiting, 1, new Mark?[9], [], null, null, null,
            now, now, null, xCapabilityHash, null, true);

    public GameSnapshot Snapshot() => new(Id, Status, Sequence, Board.ToArray(), Moves.ToArray(),
        CurrentTurn, Winner, EndReason, CreatedAt, UpdatedAt, TurnStartedAt);

    public GameState Join(string oCapabilityHash, DateTimeOffset now)
    {
        if (Status == GameStatus.Over) throw GameRuleException.Conflict("game_over", "The game is already over.");
        if (Status != GameStatus.Waiting) throw GameRuleException.Conflict("game_not_waiting", "The O seat is no longer open.");
        return this with
        {
            Status = GameStatus.Active,
            Sequence = Sequence + 1,
            CurrentTurn = Mark.X,
            OCapabilityHash = oCapabilityHash,
            UpdatedAt = now,
            TurnStartedAt = now
        };
    }

    public GameState Move(Mark player, int cell, DateTimeOffset now)
    {
        EnsureActive();
        if (player != CurrentTurn) throw GameRuleException.Conflict("wrong_turn", "It is the other seat's turn.");
        if (cell is < 0 or > 8) throw GameRuleException.Invalid("The cell must be from 0 through 8.");
        if (Board[cell] is not null) throw GameRuleException.Conflict("occupied", "The selected cell is occupied.");

        var board = Board.ToArray();
        board[cell] = player;
        var moves = Moves.Append(new GameMove(Moves.Count + 1, player, cell, now)).ToArray();
        var winner = FindWinner(board);
        var isDraw = winner is null && moves.Length == 9;
        return this with
        {
            Board = board,
            Moves = moves,
            Sequence = Sequence + 1,
            Status = winner is not null || isDraw ? GameStatus.Over : GameStatus.Active,
            CurrentTurn = winner is not null || isDraw ? null : Opponent(player),
            Winner = winner,
            EndReason = winner is not null ? TicTacToe.Api.Domain.EndReason.Line : isDraw ? TicTacToe.Api.Domain.EndReason.Draw : null,
            UpdatedAt = now,
            TurnStartedAt = winner is not null || isDraw ? null : now,
            CapacityHeld = winner is null && !isDraw
        };
    }

    public GameState Resign(Mark player, DateTimeOffset now)
    {
        if (Status == GameStatus.Over) throw GameRuleException.Conflict("game_over", "The game is already over.");
        if (Status == GameStatus.Waiting && player != Mark.X)
            throw GameRuleException.Unauthorized();

        return this with
        {
            Status = GameStatus.Over,
            Sequence = Sequence + 1,
            CurrentTurn = null,
            Winner = Status == GameStatus.Active ? Opponent(player) : null,
            EndReason = Status == GameStatus.Active ? TicTacToe.Api.Domain.EndReason.Resignation : TicTacToe.Api.Domain.EndReason.Cancelled,
            UpdatedAt = now,
            TurnStartedAt = null,
            CapacityHeld = false
        };
    }

    public GameState Abandon(Mark claimant, DateTimeOffset now)
    {
        EnsureActive();
        if (claimant == CurrentTurn)
            throw GameRuleException.Conflict("not_opponent_turn", "A seat cannot claim abandonment during its own turn.");
        var eligibleAt = TurnStartedAt!.Value.AddSeconds(180);
        if (now < eligibleAt)
            throw GameRuleException.Conflict("abandonment_not_due", "The opponent's turn is not yet overdue.", eligibleAt);
        return this with
        {
            Status = GameStatus.Over,
            Sequence = Sequence + 1,
            CurrentTurn = null,
            Winner = claimant,
            EndReason = TicTacToe.Api.Domain.EndReason.Abandonment,
            UpdatedAt = now,
            TurnStartedAt = null,
            CapacityHeld = false
        };
    }

    private void EnsureActive()
    {
        if (Status == GameStatus.Over) throw GameRuleException.Conflict("game_over", "The game is already over.");
        if (Status != GameStatus.Active) throw GameRuleException.Conflict("game_not_active", "The game is not active.");
    }

    public static Mark Opponent(Mark mark) => mark == Mark.X ? Mark.O : Mark.X;

    private static Mark? FindWinner(IReadOnlyList<Mark?> board)
    {
        int[][] lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6],
            [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        foreach (var line in lines)
        {
            var mark = board[line[0]];
            if (mark is not null && mark == board[line[1]] && mark == board[line[2]]) return mark;
        }
        return null;
    }
}

public sealed class GameRuleException : Exception
{
    private GameRuleException(string code, string message, int status, DateTimeOffset? eligibleAt = null)
        : base(message) => (Code, Status, EligibleAt) = (code, status, eligibleAt);

    public string Code { get; }
    public int Status { get; }
    public DateTimeOffset? EligibleAt { get; }
    public long? CurrentSequence { get; init; }

    public static GameRuleException Invalid(string message) => new("invalid_request", message, 400);
    public static GameRuleException Unauthorized() => new("invalid_capability", "The seat capability is missing or invalid.", 401);
    public static GameRuleException NotFound() => new("game_not_found", "The requested game does not exist.", 404);
    public static GameRuleException Conflict(string code, string message, DateTimeOffset? eligibleAt = null) => new(code, message, 409, eligibleAt);
    public static GameRuleException Stale(long current) => new("stale_sequence", "The game changed before this command was accepted.", 409) { CurrentSequence = current };
    public static GameRuleException Capacity() => new("capacity_exhausted", "All 25 waiting or active game slots are held.", 429);
}
