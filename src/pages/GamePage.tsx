import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CpuGame } from "../game/CpuGame";
import { Game, type Player } from "../game/Game";
import { triggerConfetti } from "../game/confetti";
import { playLose, playThud, playWin } from "../game/sounds";

function parsePlayer(value: string | null, fallback: Player): Player {
  return value === "X" || value === "O" ? value : fallback;
}

export default function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const humanPlayer = useMemo(
    () => parsePlayer(searchParams.get("human"), "X"),
    [searchParams]
  );
  const cpuPlayer = useMemo(() => {
    const fallback: Player = humanPlayer === "X" ? "O" : "X";
    const parsed = parsePlayer(searchParams.get("cpu"), fallback);
    return parsed === humanPlayer ? fallback : parsed;
  }, [searchParams, humanPlayer]);

  const cpuEnabled = useMemo(
    () => searchParams.get("cpu") !== "off",
    [searchParams]
  );

  const [game] = useState(() =>
    cpuEnabled ? new CpuGame({ humanPlayer, cpuPlayer }) : new Game()
  );
  const [state, setState] = useState(game.getState());
  const previousMoves = useRef(state.moves.length);
  const previousStatus = useRef(state.status);

  const outcomeMessage =
    state.status === "over"
      ? state.winner
        ? `${state.winner} wins!`
        : "Draw game."
      : state.status === "quit"
        ? "Game quit."
        : null;

  const lossMessage =
    state.status === "over" && cpuEnabled && state.winner === cpuPlayer
      ? "Try again?"
      : null;
  const turnMessage =
    state.status === "in_progress"
      ? state.currentTurn === humanPlayer
        ? "Your turn."
        : cpuEnabled
          ? "CPU turn."
          : `${state.currentTurn}'s turn.`
      : null;

  const handleCellClick = (index: number) => {
    if (game instanceof CpuGame) {
      if (game.makeHumanMove(index)) {
        setState(game.getState());
      }
      return;
    }

    if (game.makeMove(index)) {
      setState(game.getState());
    }
  };

  const handleReset = () => {
    game.reset();
    setState(game.getState());
  };

  const handleQuit = () => {
    game.quit();
    setState(game.getState());
    navigate("/");
  };

  useEffect(() => {
    const diff = state.moves.length - previousMoves.current;
    if (diff > 0 && state.status !== "quit") {
      for (let i = 0; i < diff; i += 1) {
        playThud(i * 0.1);
      }
    }
    previousMoves.current = state.moves.length;
  }, [state.moves.length, state.status]);

  useEffect(() => {
    if (previousStatus.current !== "over" && state.status === "over") {
      if (state.winner === humanPlayer) {
        playWin();
        triggerConfetti();
      } else if (state.winner === cpuPlayer) {
        playLose();
      }
    }
    previousStatus.current = state.status;
  }, [state.status, state.winner, humanPlayer, cpuPlayer]);

  return (
    <section className="game-page">
      <h1>Game Detail</h1>
      <p className="game-meta">
        You are <strong>{humanPlayer}</strong>. CPU is <strong>{cpuPlayer}</strong>.
      </p>
      <div
        className={`game-status ${state.status !== "in_progress" ? "is-over" : ""} ${lossMessage ? "is-loss" : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="game-status"
      >
        <span>Status: {state.status.replace("_", " ")}</span>
        <span data-testid="game-turn">Current turn: {state.currentTurn}</span>
        <span className="game-outcome" data-testid="game-outcome">
          {outcomeMessage ?? "Game in progress."}
        </span>
        {turnMessage ? (
          <span className="game-turn" data-testid="game-turn-message">
            {turnMessage}
          </span>
        ) : null}
        {lossMessage ? (
          <span className="game-loss" data-testid="game-loss-message">
            {lossMessage}
          </span>
        ) : null}
      </div>
      <div className="board" data-testid="game-board">
        {state.board.map((cell, index) => {
          const isDisabled =
            cell !== null ||
            state.status !== "in_progress" ||
            (cpuEnabled && state.currentTurn !== humanPlayer);
          const row = Math.floor(index / 3) + 1;
          const col = (index % 3) + 1;
          const cellLabel = cell
            ? `Row ${row} Column ${col}, occupied by ${cell}`
            : `Row ${row} Column ${col}, empty`;

          return (
            <button
              className="cell"
              key={index}
              type="button"
              onClick={() => handleCellClick(index)}
              disabled={isDisabled}
              data-disabled={isDisabled ? "true" : "false"}
              data-testid={`board-cell-${index}`}
              aria-label={cellLabel}
            >
              <span className="cell-value" aria-hidden="true">
                {cell ?? ""}
              </span>
              <span className="sr-only">{cellLabel}</span>
            </button>
          );
        })}
      </div>
      <div className="game-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={handleReset}
          data-testid="rematch"
        >
          {state.status === "over" ? "Rematch" : "Start new game"}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={handleQuit}
          data-testid="quit"
        >
          Quit
        </button>
      </div>
    </section>
  );
}
