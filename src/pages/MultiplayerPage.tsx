import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { triggerConfetti } from "../game/confetti";
import { playLose, playThud, playWin } from "../game/sounds";

type MultiplayerState = {
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

type WaitingGame = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  moveCount: number;
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

export default function MultiplayerPage() {
  const apiBase = useMemo(() => getApiBase(), []);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<MultiplayerState | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [waitingGames, setWaitingGames] = useState<WaitingGame[]>([]);
  const [listStatus, setListStatus] = useState<"idle" | "loading" | "error">("idle");
  const [listError, setListError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [playerId] = useState(() => `player-${crypto.randomUUID().slice(0, 8)}`);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "copied" | "error">("idle");
  const [moveError, setMoveError] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState(false);
  const [abandonmentMessage, setAbandonmentMessage] = useState<string | null>(null);
  const [lossMessage, setLossMessage] = useState<string | null>(null);
  const [rematchInvite, setRematchInvite] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("connected");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const reconnectAttempt = useRef(0);
  const createdRef = useRef(false);
  const activeGameIdRef = useRef<string | null>(null);
  const previousMoves = useRef(0);
  const previousStatus = useRef<string | null>(null);
  const applyStateUpdate = useCallback((partial: Partial<MultiplayerState>) => {
    setState((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);
  const playerMark = useMemo(() => {
    return state?.players?.find((player) => player.id === playerId)?.mark ?? null;
  }, [state, playerId]);
  const board = useMemo(
    () => state?.board ?? Array.from({ length: 9 }, () => null),
    [state]
  );
  const inviteLink = useMemo(() => {
    if (!state?.id || typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/multiplayer?mode=join&room=${state.id}`;
  }, [state?.id]);
  const effectiveStatus =
    state?.winner && state.status === "waiting" ? "over" : state?.status;
  const isWaiting = effectiveStatus === "waiting";
  const showWaitingRoom = isWaiting && playerMark === "X";

  const fetchGameState = useCallback(
    async (gameId: string) => {
      try {
        const response = await fetch(`${apiBase}/games/${gameId}`);
        if (response.status === 404) {
          setError("Game not found.");
          setStatus("error");
          return;
        }
        if (response.status === 410) {
          const data = (await response.json()) as MultiplayerState;
          applyStateUpdate({ ...data, status: "over" });
          return;
        }
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as MultiplayerState;
        if (activeGameIdRef.current === gameId) {
          setState(data);
        }
      } catch {
        return;
      }
    },
    [apiBase, applyStateUpdate]
  );

  const connectWs = useCallback(
    (gameId: string) => {
      activeGameIdRef.current = gameId;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (reconnectAttempt.current > 0) {
        setConnectionStatus("reconnecting");
      }
      const ws = new WebSocket(buildWsUrl(gameId));
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as WsMessage;
          if (message.type === "state_catchup" && message.payload) {
            const payload = message.payload as MultiplayerState;
            if (activeGameIdRef.current === payload.id) {
              setState(payload);
              setCopyStatus("idle");
              setInviteStatus("idle");
            }
          }
          if (message.type === "player_joined" && message.payload) {
            const payload = message.payload as {
              roomId?: string;
              state?: MultiplayerState;
              players?: MultiplayerState["players"];
            };
            if (payload.roomId && payload.roomId !== activeGameIdRef.current) {
              return;
            }
            if (payload.state) {
              applyStateUpdate(payload.state);
            }
            if (payload.players) {
              applyStateUpdate({ players: payload.players });
            }
          }
          if (message.type === "move_accepted" && message.payload) {
            const payload = message.payload as {
              roomId?: string;
              state?: MultiplayerState;
              players?: MultiplayerState["players"];
            };
            if (payload.roomId && payload.roomId !== activeGameIdRef.current) {
              return;
            }
            if (payload.state) {
              applyStateUpdate(payload.state);
              setMoveError(null);
              setPendingMove(false);
            }
            if (payload.players) {
              applyStateUpdate({ players: payload.players });
            }
          }
          if (message.type === "move_rejected" && message.payload) {
            const payload = message.payload as { error?: { message?: string } };
            setMoveError(payload.error?.message ?? "Move rejected. Try again.");
            setPendingMove(false);
          }
          if (message.type === "game_over" && message.payload) {
            const payload = message.payload as {
              roomId?: string;
              state?: MultiplayerState;
              winner?: string | null;
            };
            if (payload.roomId && payload.roomId !== activeGameIdRef.current) {
              return;
            }
            applyStateUpdate({
              status: "over",
              ...(payload.state ?? {}),
              winner: payload.winner ?? null,
            });
            setAbandonmentMessage(null);
          }
          if (message.type === "rematch_invite" && message.payload) {
            const payload = message.payload as { roomId?: string; newGameId?: string };
            if (payload.roomId && payload.roomId !== activeGameIdRef.current) {
              return;
            }
            if (payload.newGameId) {
              setRematchInvite(payload.newGameId);
            }
          }
        } catch (err) {
          console.warn("Failed to parse WS message", err);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("reconnecting");
        if (activeGameIdRef.current === gameId) {
          fetchGameState(gameId);
          reconnectAttempt.current += 1;
          const delay = Math.min(30_000, 1000 * 2 ** reconnectAttempt.current);
          if (reconnectAttempt.current >= 5) {
            setConnectionStatus("disconnected");
          }
          reconnectTimer.current = window.setTimeout(() => {
            if (activeGameIdRef.current === gameId) {
              connectWs(gameId);
            }
          }, delay);
        }
      };

      ws.onerror = () => {
        setConnectionStatus("reconnecting");
      };
    },
    [applyStateUpdate, fetchGameState]
  );

  const loadWaitingGames = useCallback(async () => {
    setListStatus("loading");
    setListError(null);
    try {
      const response = await fetch(`${apiBase}/games`);
      if (!response.ok) {
        throw new Error(`List failed (${response.status})`);
      }
      const data = (await response.json()) as { games?: WaitingGame[] };
      setWaitingGames(data.games ?? []);
      setListStatus("idle");
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load games");
      setListStatus("error");
    }
  }, [apiBase]);

  const createGame = useCallback(
    async (force = false) => {
      if (createdRef.current && !force) {
        return;
      }
      createdRef.current = true;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch(`${apiBase}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Server is at capacity. Please try again later.");
        }
        throw new Error(`Create failed (${response.status})`);
      }
      const data = (await response.json()) as { id: string; status: string; createdAt: string };
      setState({
        id: data.id,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        moveCount: 0,
      });
      setStatus("ready");
      connectWs(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
      setStatus("error");
    }
    },
    [apiBase, connectWs, playerId]
  );

  const joinGame = useCallback(
    async (gameId: string) => {
      setStatus("loading");
      setError(null);
      setJoinError(null);
      try {
        const response = await fetch(`${apiBase}/games/${gameId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
        if (!response.ok) {
          if (response.status === 404) {
            setJoinError("Game not found.");
            setStatus("idle");
            return;
          }
          if (response.status === 409) {
            setJoinError("Game already started.");
            loadWaitingGames();
            setStatus("idle");
            return;
          }
          throw new Error(`Join failed (${response.status})`);
        }
        const data = (await response.json()) as {
          game?: MultiplayerState;
          event?: string;
        };
        if (!data.game) {
          throw new Error("Join response missing game");
        }
        setState({
          id: data.game.id,
          status: data.game.status,
          createdAt: data.game.createdAt,
          updatedAt: data.game.updatedAt,
          lastMoveAt: data.game.lastMoveAt,
          moveCount: data.game.moveCount,
          currentTurn: data.game.currentTurn,
          players: data.game.players,
          moves: data.game.moves,
          board: data.game.board,
          winner: data.game.winner ?? null,
        });
        setStatus("ready");
        connectWs(data.game.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join game");
        setStatus("error");
      }
    },
    [apiBase, connectWs, loadWaitingGames, playerId]
  );

  const copyGameId = useCallback(async () => {
    if (!state?.id) {
      return;
    }
    try {
      await navigator.clipboard.writeText(state.id);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setCopyStatus("error");
    }
  }, [state]);

  const copyInviteLink = useCallback(async () => {
    if (!inviteLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteStatus("copied");
      window.setTimeout(() => setInviteStatus("idle"), 1500);
    } catch {
      setInviteStatus("error");
    }
  }, [inviteLink]);

  const handleRematch = useCallback(() => {
    if (!state) {
      return;
    }
    setRematchInvite(null);
    setSearchParams({ mode: "create" });
    createdRef.current = false;
    setState(null);
    setStatus("idle");
    setMoveError(null);
    setPendingMove(false);
    setCopyStatus("idle");
    setInviteStatus("idle");
    setAbandonmentMessage(null);
    setLossMessage(null);
    previousMoves.current = 0;
    previousStatus.current = null;
    activeGameIdRef.current = null;
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    reconnectAttempt.current = 0;
    setConnectionStatus("disconnected");
    fetch(`${apiBase}/games/${state.id}/rematch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Rematch failed.");
        }
        return res.json();
      })
      .then((data: { id: string; status: string; createdAt: string }) => {
        setState({
          id: data.id,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.createdAt,
          moveCount: 0,
        });
        setStatus("ready");
        connectWs(data.id);
      })
      .catch(() => {
        setMoveError("Rematch failed.");
      });
  }, [apiBase, connectWs, playerId, setSearchParams, state]);

  const acceptRematch = useCallback(() => {
    if (!rematchInvite) {
      return;
    }
    setSearchParams({ mode: "join", room: rematchInvite });
    setRematchInvite(null);
  }, [rematchInvite, setSearchParams]);

  const handleLeave = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    activeGameIdRef.current = null;
    setConnectionStatus("disconnected");
    setRematchInvite(null);
    navigate("/");
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const makeMove = useCallback(
    async (index: number) => {
      if (!state) {
        return;
      }
      if (!playerMark) {
        setMoveError("You are not a player in this game.");
        return;
      }
      if (state.status !== "active") {
        setMoveError("Game is not active yet.");
        return;
      }
      if (state.currentTurn !== playerMark) {
        setMoveError("Wait for your turn.");
        return;
      }
      if (board[index] !== null) {
        setMoveError("That square is already taken.");
        return;
      }

      setMoveError(null);
      setPendingMove(true);
      const response = await fetch(`${apiBase}/games/${state.id}/moves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, index }),
      });
      if (!response.ok) {
        try {
          const payload = (await response.json()) as { message?: string };
          setMoveError(payload.message ?? "Move rejected.");
        } catch {
          setMoveError("Move rejected.");
        }
        setPendingMove(false);
        return;
      }

      try {
        const payload = (await response.json()) as { type?: string; payload?: { state?: MultiplayerState } };
        if (payload.type === "move_accepted" && payload.payload?.state) {
          applyStateUpdate(payload.payload.state);
          setPendingMove(false);
        }
      } catch {
        // No-op: WS will catch up if response isn't parseable.
      }
    },
    [apiBase, applyStateUpdate, board, playerMark, playerId, state]
  );

  const resignGame = useCallback(async () => {
    if (!state || !playerMark) {
      return;
    }
    try {
      const response = await fetch(`${apiBase}/games/${state.id}/resign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setMoveError(payload.message ?? "Resign failed.");
        return;
      }
      const payload = (await response.json()) as {
        payload?: { state?: MultiplayerState; winner?: string | null };
      };
      applyStateUpdate({
        status: "over",
        ...(payload.payload?.state ?? {}),
        winner: payload.payload?.winner ?? (playerMark === "X" ? "O" : "X"),
      });
      setAbandonmentMessage(null);
    } catch {
      setMoveError("Resign failed.");
    }
  }, [apiBase, applyStateUpdate, playerId, playerMark, state]);

  const checkAbandonment = useCallback(async () => {
    if (!state || !playerMark) {
      return;
    }
    setAbandonmentMessage(null);
    try {
      const response = await fetch(`${apiBase}/games/${state.id}/abandonment-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setAbandonmentMessage(payload.message ?? "Abandonment check failed.");
        return;
      }
      const payload = (await response.json()) as
        | { abandoned: false; reason?: string }
        | { payload?: { state?: MultiplayerState; winner?: string | null } };
      if ("abandoned" in payload) {
        setAbandonmentMessage("Opponent still active.");
        return;
      }
      applyStateUpdate({
        status: "over",
        ...(payload.payload?.state ?? {}),
        winner: payload.payload?.winner ?? (playerMark === "X" ? "O" : "X"),
      });
      setAbandonmentMessage("Opponent abandoned the game.");
    } catch {
      setAbandonmentMessage("Abandonment check failed.");
    }
  }, [apiBase, applyStateUpdate, playerId, playerMark, state]);

  useEffect(() => {
    const initialMode = searchParams.get("mode");
    const roomCode = searchParams.get("room");
    if (roomCode && roomCode.trim()) {
      setMode("join");
      return;
    }
    if (initialMode === "join") {
      setMode("join");
      return;
    }
    if (initialMode === "create") {
      setMode("create");
      return;
    }
  }, [searchParams]);

  useEffect(() => {
    const roomCode = searchParams.get("room");
    if (mode === "create" && !roomCode) {
      createGame();
    } else {
      setState(null);
      setStatus("idle");
      createdRef.current = false;
      if (roomCode && roomCode.trim()) {
        fetchGameState(roomCode.trim());
        joinGame(roomCode.trim());
      } else {
        loadWaitingGames();
      }
    }
    return () => {
      socketRef.current?.close();
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
      }
      reconnectAttempt.current = 0;
    };
  }, [createGame, fetchGameState, joinGame, loadWaitingGames, mode, searchParams]);

  useEffect(() => {
    if (!state) {
      return;
    }
    const diff = state.moveCount - previousMoves.current;
    if (diff > 0) {
      for (let i = 0; i < diff; i += 1) {
        playThud(i * 0.1);
      }
    }
    previousMoves.current = state.moveCount;
  }, [state]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (previousStatus.current !== "over" && state.status === "over") {
      if (playerMark && state.winner === playerMark) {
        playWin();
        triggerConfetti();
        setLossMessage(null);
      } else if (playerMark && state.winner && state.winner !== playerMark) {
        playLose();
        setLossMessage("Try again?");
      } else {
        setLossMessage(null);
      }
    }
    previousStatus.current = state.status;
  }, [state, playerMark]);

  return (
    <section className="multiplayer-page">
      <h1>Multiplayer Lobby</h1>
      <p>Create a room, then share the code with a friend to join.</p>
      <div className="multiplayer-mode">
        <button
          className={`secondary-button ${mode === "create" ? "is-active" : ""}`}
          type="button"
          onClick={() => setMode("create")}
        >
          Create
        </button>
        <button
          className={`secondary-button ${mode === "join" ? "is-active" : ""}`}
          type="button"
          onClick={() => setMode("join")}
        >
          Join
        </button>
      </div>
      {status === "loading" ? <p>Creating game...</p> : null}
      {status === "error" ? (
        <div className="error-banner" role="status">
          <p className="error-text">{error}</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => createGame(true)}
          >
            Retry
          </button>
        </div>
      ) : null}
      {state ? (
        <>
          <div className="multiplayer-card">
            <div className="multiplayer-row">
              <span className="label">Game ID</span>
              <span className="value" data-testid="multiplayer-game-id">
                {state.id}
              </span>
            </div>
            <div className="multiplayer-row">
              <span className="label">Status</span>
              <span className="value" data-testid="multiplayer-status">
                {effectiveStatus === "waiting" ? "Waiting for opponent…" : effectiveStatus}
              </span>
            </div>
            <div className="multiplayer-row">
              <span className="label">You are</span>
              <span className="value">
                {playerMark ? `Player ${playerMark}` : "Spectator"}
              </span>
            </div>
            <div className="multiplayer-row">
              <span className="label">Moves</span>
              <span className="value">{state.moveCount}</span>
            </div>
            <div className="multiplayer-row">
              <span className="label">Turn</span>
              <span className="value">
                {effectiveStatus === "waiting"
                  ? "Waiting for opponent…"
                  : effectiveStatus === "over"
                    ? state.winner
                      ? `Player ${state.winner} wins`
                      : "Draw"
                    : playerMark
                      ? state.currentTurn === playerMark
                        ? "Your turn"
                        : `Player ${state.currentTurn}'s turn`
                      : `Player ${state.currentTurn}'s turn`}
              </span>
            </div>
            <div className="multiplayer-row">
              <span className="label">Connection</span>
              <span className="value">{connectionStatus}</span>
            </div>
            <div className="multiplayer-row">
              <span className="label">Last move</span>
              <span className="value">{state.lastMoveAt ?? state.updatedAt}</span>
            </div>
          </div>
          {rematchInvite ? (
            <div className="rematch-invite" role="status">
              <p>Opponent started a rematch.</p>
              <button className="secondary-button" type="button" onClick={acceptRematch}>
                Join rematch
              </button>
            </div>
          ) : null}
          {showWaitingRoom ? (
            <div className="waiting-room">
              <p>Share this game ID with a friend to join.</p>
              <div className="waiting-room-actions">
                <span className="game-id">{state.id}</span>
                <button className="secondary-button" type="button" onClick={copyGameId}>
                  {copyStatus === "copied" ? "Copied" : "Copy ID"}
                </button>
                <button className="secondary-button" type="button" onClick={copyInviteLink}>
                  {inviteStatus === "copied" ? "Invite copied" : "Copy invite link"}
                </button>
                {copyStatus === "error" ? (
                  <span className="error-text">Copy failed</span>
                ) : null}
                {inviteStatus === "error" ? (
                  <span className="error-text">Invite copy failed</span>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="multiplayer-board" data-testid="multiplayer-board">
            {moveError ? <p className="error-text">{moveError}</p> : null}
            {abandonmentMessage ? <p className="hint">{abandonmentMessage}</p> : null}
            <div className="board">
              {board.map((cell, index) => {
                const isDisabled =
                  !playerMark ||
                  state.status !== "active" ||
                  state.currentTurn !== playerMark ||
                  cell !== null ||
                  pendingMove;
                return (
                  <button
                    className="cell"
                    key={index}
                    type="button"
                    onClick={() => makeMove(index)}
                    disabled={isDisabled}
                    data-disabled={isDisabled ? "true" : "false"}
                    data-testid={`multiplayer-cell-${index}`}
                    aria-label={`Cell ${index + 1}`}
                  >
                    <span className="cell-value" aria-hidden="true">
                      {cell ?? ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {effectiveStatus === "over" ? (
            <div className="multiplayer-outcome" data-testid="multiplayer-outcome">
              {state.winner ? (
                <p>
                  Player {state.winner} wins.{" "}
                  {playerMark
                    ? state.winner === playerMark
                      ? "You won!"
                      : "You lost."
                    : "Spectating."}
                </p>
              ) : (
                <p>Draw game.</p>
              )}
              {lossMessage ? <p className="game-loss">{lossMessage}</p> : null}
            </div>
          ) : null}
          {state.status === "active" && playerMark ? (
            <div className="multiplayer-actions">
              <button className="secondary-button" type="button" onClick={resignGame}>
                Resign
              </button>
              <button className="secondary-button" type="button" onClick={checkAbandonment}>
                Abandonment check
              </button>
              <button className="secondary-button" type="button" onClick={handleLeave}>
                Leave
              </button>
            </div>
          ) : null}
          {state.status === "over" ? (
            <div className="multiplayer-actions">
              <button className="secondary-button" type="button" onClick={handleRematch}>
                Rematch
              </button>
              <button className="secondary-button" type="button" onClick={handleLeave}>
                Leave
              </button>
            </div>
          ) : null}
          <div className="multiplayer-history" data-testid="multiplayer-move-history">
            <h2>Move history</h2>
            {state.moves && state.moves.length > 0 ? (
              <ol>
                {state.moves.map((move) => (
                  <li key={`${move.turn}-${move.index}`}>
                    Turn {move.turn}: {move.mark} → {move.index + 1}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="hint">No moves yet.</p>
            )}
          </div>
        </>
      ) : null}
      {mode === "join" ? (
        <div className="waiting-list">
          <div className="waiting-list-header">
            <h2>Waiting games</h2>
            <button
              className="secondary-button"
              type="button"
              onClick={loadWaitingGames}
              disabled={listStatus === "loading"}
            >
              Refresh
            </button>
          </div>
          {listStatus === "loading" ? <p>Loading games...</p> : null}
          {listStatus === "error" ? <p className="error-text">{listError}</p> : null}
          {joinError ? (
            joinError === "Game not found." ? (
              <div className="error-banner" role="status">
                <p className="error-text">{joinError}</p>
                <button className="secondary-button" type="button" onClick={handleBack}>
                  Back to landing
                </button>
              </div>
            ) : (
              <p className="error-text">{joinError}</p>
            )
          ) : null}
          {waitingGames.length === 0 && listStatus !== "loading" ? (
            <p className="hint">No waiting games yet.</p>
          ) : (
            <ul className="waiting-games" data-testid="waiting-games">
              {waitingGames.map((game) => (
                <li key={game.id} className="waiting-game">
                  <div>
                    <div className="game-id">{game.id}</div>
                    <div className="game-meta-row">
                      Created: {game.createdAt} · Status: {game.status}
                    </div>
                  </div>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => joinGame(game.id)}
                    disabled={game.status !== "waiting"}
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      <p className="hint">
        This view updates in real time as moves are made or players join.
      </p>
    </section>
  );
}
