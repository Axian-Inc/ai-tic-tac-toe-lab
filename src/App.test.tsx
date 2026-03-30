import { act } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type {
  GetGameResponse,
  ListGamesResponse,
  MultiplayerGameSnapshot,
} from "./shared/multiplayer";

const { listMultiplayerGamesMock, getMultiplayerGameMock } = vi.hoisted(() => ({
  listMultiplayerGamesMock: vi.fn<
    (status: "waiting" | "active" | "over") => Promise<ListGamesResponse>
  >(),
  getMultiplayerGameMock: vi.fn<(gameId: string) => Promise<GetGameResponse>>(),
}));

vi.mock("./multiplayer/api", async () => {
  const actual = await vi.importActual<typeof import("./multiplayer/api")>(
    "./multiplayer/api"
  );

  return {
    ...actual,
    checkMultiplayerAbandonment: vi.fn(),
    createMultiplayerGame: vi.fn(),
    getMultiplayerGame: getMultiplayerGameMock,
    getMultiplayerGameWithOptions: vi.fn(),
    getMultiplayerWebSocketUrl: vi.fn(() => "ws://localhost:3001/ws?gameId=game-1"),
    joinMultiplayerGame: vi.fn(),
    listMultiplayerGames: listMultiplayerGamesMock,
    resignMultiplayerGame: vi.fn(),
    submitMultiplayerMove: vi.fn(),
  };
});

class MockWebSocket {
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  private readonly listeners = new Map<string, Set<(event: Event) => void>>();

  constructor(public readonly url: string) {}

  addEventListener(type: string, listener: (event: Event) => void): void {
    const listeners = this.listeners.get(type) ?? new Set<(event: Event) => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {}
}

function getButtonByText(text: string): HTMLButtonElement {
  const buttons = Array.from(document.querySelectorAll("button"));
  const button = buttons.find((candidate) => candidate.textContent?.trim() === text);

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Unable to find button with text: ${text}`);
  }

  return button;
}

function getGameCardSpectateButton(): HTMLButtonElement {
  const button = document.querySelector(
    ".multiplayer-game-card-active .multiplayer-join-button"
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Unable to find spectate action for an active game card.");
  }

  return button;
}

async function clickButton(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function createSnapshot(
  overrides: Partial<MultiplayerGameSnapshot> = {}
): MultiplayerGameSnapshot {
  return {
    id: "game-1",
    name: "Lunch Match",
    status: "active",
    createdAt: "2026-03-30T12:00:00.000Z",
    updatedAt: "2026-03-30T12:05:00.000Z",
    hostName: "Host",
    openSeatCount: 0,
    players: {
      X: {
        player: "X",
        name: "Host",
        joinedAt: "2026-03-30T12:00:00.000Z",
      },
      O: {
        player: "O",
        name: "Guest",
        joinedAt: "2026-03-30T12:01:00.000Z",
      },
    },
    state: {
      board: [null, null, null, null, "X", null, null, "O", null],
      currentPlayer: "X",
      moves: [
        { order: 1, player: "X", position: 4 },
        { order: 2, player: "O", position: 7 },
      ],
      status: {
        isDraw: false,
        isOver: false,
        winner: null,
      },
    },
    completion: null,
    history: {
      retention: {
        mode: "process-memory",
        survivesServiceRestart: false,
      },
      events: [
        {
          type: "game-created",
          occurredAt: "2026-03-30T12:00:00.000Z",
          player: "X",
          sequence: 1,
        },
        {
          type: "player-joined",
          occurredAt: "2026-03-30T12:01:00.000Z",
          player: "O",
          sequence: 2,
        },
      ],
    },
    activity: {
      abandonmentDeadlineAt: "2026-03-30T12:08:00.000Z",
      abandonmentTimeoutMs: 180000,
      awaitingPlayer: "X",
      awaitingSince: "2026-03-30T12:05:00.000Z",
      lastProgressedAt: "2026-03-30T12:05:00.000Z",
    },
    ...overrides,
  };
}

describe("App spectate flow", () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    window.history.replaceState({}, "", "/");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("renders a visible Spectate control on the landing page", () => {
    listMultiplayerGamesMock.mockResolvedValue({ games: [] });

    act(() => {
      root.render(<App />);
    });

    expect(getButtonByText("Spectate")).toBeTruthy();
  });

  it("loads only active games for spectating and opens spectator gameplay", async () => {
    listMultiplayerGamesMock.mockImplementation(async (status) => {
      if (status !== "active") {
        throw new Error(`unexpected status ${status}`);
      }

      return {
        games: [
          {
            id: "game-1",
            name: "Lunch Match",
            status: "active",
            createdAt: "2026-03-30T12:00:00.000Z",
            updatedAt: "2026-03-30T12:05:00.000Z",
            hostName: "Host",
            openSeatCount: 0,
          },
        ],
      };
    });
    getMultiplayerGameMock.mockResolvedValue({
      game: createSnapshot(),
    });

    act(() => {
      root.render(<App />);
    });

    await clickButton(getButtonByText("Spectate"));

    await vi.waitFor(() => {
      expect(listMultiplayerGamesMock).toHaveBeenCalledWith("active");
    });
    expect(listMultiplayerGamesMock).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain("Join or spectate a multiplayer game");
    expect(container.textContent).toContain("Spectate an active multiplayer game");
    expect(container.textContent).toContain("Lunch Match");

    await clickButton(getGameCardSpectateButton());

    await vi.waitFor(() => {
      expect(getMultiplayerGameMock).toHaveBeenCalledWith("game-1");
    });
    expect(container.textContent).toContain("You are spectating");
    expect(getButtonByText("Home")).toBeTruthy();
    expect(container.textContent).not.toContain("Resign");
  });
});
