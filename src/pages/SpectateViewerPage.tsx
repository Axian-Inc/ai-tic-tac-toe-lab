import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

type ViewerState = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMoveAt?: string;
  moveCount: number;
  currentTurn?: string;
  players?: { id: string; mark: string }[];
  moves?: { index: number; mark: string; turn: number; at: string }[];
  board?: (string | null)[];
  winner?: string | null;
};

type WsMessage = {
  type?: string;
  payload?: unknown;
};

function getApiBase() {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE;
  return env?.trim() ? env.trim() : "http://localhost:3001";
}

function buildWsUrl(gameId: string) {
  const base = getApiBase();
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.searchParams.set("gameId", gameId);
  return url.toString();
}

export default function SpectateViewerPage() {
  const { gameId } = useParams();
  const [state, setState] = useState<ViewerState | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const activeGameIdRef = useRef<string | null>(null);
  const previousMoveCount = useRef(0);
  const highlightTimerRef = useRef<number | null>(null);
  const board = useMemo(
    () => state?.board ?? Array.from({ length: 9 }, () => null),
    [state]
  );
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!gameId) {
      setStatus("error");
      setError("Missing game id.");
      return;
    }

    activeGameIdRef.current = gameId;
    const ws = new WebSocket(buildWsUrl(gameId));
    socketRef.current = ws;
    setConnectionStatus("connecting");

    ws.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WsMessage;
        if (!message.type) {
          return;
        }
        if (message.type === "state_catchup" && message.payload) {
          setState(message.payload as ViewerState);
          setStatus("ready");
          return;
        }
        if (message.type === "player_joined" && message.payload) {
          const payload = message.payload as {
            roomId?: string;
            state?: ViewerState;
            players?: ViewerState["players"];
          };
          if (payload.roomId && payload.roomId !== activeGameIdRef.current) {
            return;
          }
          if (payload.state) {
            setState((prev) => (prev ? { ...prev, ...payload.state } : prev));
          }
          if (payload.players) {
            setState((prev) => (prev ? { ...prev, players: payload.players } : prev));
          }
          return;
        }
        if (message.type === "move_accepted" && message.payload) {
          const payload = message.payload as { roomId?: string; state?: ViewerState };
          if (payload.roomId && payload.roomId !== activeGameIdRef.current) {
            return;
          }
          if (payload.state) {
            setState((prev) => (prev ? { ...prev, ...payload.state } : prev));
          }
          return;
        }
        if (message.type === "game_over" && message.payload) {
          const payload = message.payload as {
            roomId?: string;
            state?: ViewerState;
            winner?: string | null;
          };
          if (payload.roomId && payload.roomId !== activeGameIdRef.current) {
            return;
          }
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  status: "over",
                  ...(payload.state ?? {}),
                  winner: payload.winner ?? prev.winner ?? null,
                }
              : prev
          );
          return;
        }
        if (message.type === "abandoned" && message.payload) {
          const payload = message.payload as { roomId?: string; state?: ViewerState };
          if (payload.roomId && payload.roomId !== activeGameIdRef.current) {
            return;
          }
          if (payload.state) {
            setState((prev) => (prev ? { ...prev, ...payload.state } : prev));
          }
        }
      } catch (err) {
        console.warn("Failed to parse spectator WS message", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      setStatus((prev) => {
        if (prev !== "ready") {
          setError("Unable to connect to game.");
          return "error";
        }
        return prev;
      });
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [gameId]);

  const moves = useMemo(() => state?.moves ?? [], [state?.moves]);
  const currentTurn = state?.currentTurn ?? "Unknown";
  const effectiveStatus = state?.status ?? "loading";

  useEffect(() => {
    if (!moves.length) {
      previousMoveCount.current = 0;
      setHighlightIndex(null);
      return;
    }
    if (moves.length > previousMoveCount.current) {
      const lastMove = moves[moves.length - 1];
      setHighlightIndex(lastMove?.index ?? null);
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightIndex(null);
      }, 1500);
    }
    previousMoveCount.current = moves.length;
  }, [moves]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  return (
    <section className="spectate-viewer">
      <div className="spectate-header">
        <div>
          <h1>Spectate game</h1>
          <p className="spectate-label">Spectating • Live updates stream in real time.</p>
        </div>
        <Link className="secondary-button" to="/spectate">
          Back to list
        </Link>
      </div>

      {status === "error" ? (
        <div className="spectate-panel">
          <p className="error-text">{error ?? "Unable to load game."}</p>
        </div>
      ) : (
        <div className="spectate-viewer-layout">
          <div className="spectate-panel" data-testid="spectate-info">
            <div className="spectate-row">
              <span className="label">Game ID</span>
              <span className="value spectate-id-value">{state?.id ?? "Loading..."}</span>
            </div>
            <div className="spectate-row">
              <span className="label">Status</span>
              <span className="value" data-testid="spectate-status">
                {effectiveStatus}
              </span>
            </div>
            <div className="spectate-row">
              <span className="label">Turn</span>
              <span className="value" data-testid="spectate-turn">
                {effectiveStatus === "over"
                  ? state?.winner
                    ? `Player ${state.winner} wins`
                    : "Draw"
                  : `Player ${currentTurn}`}
              </span>
            </div>
            <div className="spectate-row">
              <span className="label">Moves</span>
              <span className="value">{state?.moveCount ?? 0}</span>
            </div>
            <div className="spectate-row">
              <span className="label">Last updated</span>
              <span className="value">
                {state?.updatedAt
                  ? new Date(state.updatedAt).toLocaleString("en-US")
                  : "—"}
              </span>
            </div>
            <div className="spectate-row">
              <span className="label">Connection</span>
              <span className={`connection-pill ${connectionStatus}`}>
                {connectionStatus}
              </span>
            </div>
          </div>
          <div className="spectate-board" data-testid="spectate-board">
            <div className="board">
              {board.map((cell, index) => {
                const row = Math.floor(index / 3) + 1;
                const col = (index % 3) + 1;
                const cellLabel = cell
                  ? `Row ${row} Column ${col}, occupied by ${cell}`
                  : `Row ${row} Column ${col}, empty`;
                return (
                  <button
                    className={`cell ${highlightIndex === index ? "is-highlighted" : ""}`}
                    key={index}
                    type="button"
                    disabled
                    data-disabled="true"
                    aria-label={cellLabel}
                  >
                    <span className="cell-value" aria-hidden="true">
                      {cell ?? ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="spectate-history">
            <h2>Move history</h2>
            {moves.length > 0 ? (
              <ol>
                {moves.map((move) => (
                  <li key={`${move.turn}-${move.index}`}>
                    Turn {move.turn}: {move.mark} → {move.index + 1}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="hint">No moves yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
