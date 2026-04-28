import { getApiWsUrl } from "./config";
import type { PlayerMark } from "../game";
import type { ApiErrorResponse, GameEvent, OnlineRole } from "./types";

export type OnlineConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type PlayerSubscription = {
  gameId: string;
  role: "player";
  playerToken: string;
};

export type SpectatorSubscription = {
  gameId: string;
  role: "spectator";
  displayName: string;
};

export type OnlineSubscription = PlayerSubscription | SpectatorSubscription;

type SubscriptionConfirmedMessage = {
  type: "subscription.confirmed";
  gameId: string;
  role: OnlineRole;
  playerMark?: PlayerMark;
  latestSequence: number;
};

type WebSocketErrorMessage = {
  type: "error";
  error: ApiErrorResponse["error"];
};

export type OnlineSocketCallbacks = {
  onStatusChange: (status: OnlineConnectionStatus) => void;
  onSubscriptionConfirmed: (message: SubscriptionConfirmedMessage, wasReconnect: boolean) => void;
  onGameEvent: (event: GameEvent) => void;
  onError: (message: string) => void;
};

export type OnlineSocket = {
  close: () => void;
};

const RECONNECT_DELAYS_MS = [500, 1_000, 2_000, 4_000, 8_000];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isGameEvent = (value: Record<string, unknown>): value is GameEvent =>
  typeof value.gameId === "string" &&
  typeof value.sequence === "number" &&
  typeof value.type === "string" &&
  typeof value.createdAt === "string" &&
  isRecord(value.payload);

const buildSubscribeMessage = (subscription: OnlineSubscription): Record<string, string> => {
  if (subscription.role === "player") {
    return {
      type: "subscribe",
      gameId: subscription.gameId,
      role: subscription.role,
      playerToken: subscription.playerToken,
    };
  }

  return {
    type: "subscribe",
    gameId: subscription.gameId,
    role: subscription.role,
    displayName: subscription.displayName,
  };
};

export const openOnlineGameSocket = (
  subscription: OnlineSubscription,
  callbacks: OnlineSocketCallbacks,
): OnlineSocket => {
  const WebSocketCtor = globalThis.WebSocket;
  if (WebSocketCtor === undefined) {
    throw new Error("This browser does not support WebSocket connections.");
  }

  let socket: WebSocket | null = null;
  let closedByClient = false;
  let reconnectAttempt = 0;
  let reconnectTimer: number | undefined;
  let hasConnectedOnce = false;

  const clearReconnectTimer = () => {
    if (reconnectTimer !== undefined) {
      globalThis.clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
  };

  const connect = () => {
    callbacks.onStatusChange(hasConnectedOnce ? "reconnecting" : "connecting");
    socket = new WebSocketCtor(getApiWsUrl());

    socket.addEventListener("open", () => {
      socket?.send(JSON.stringify(buildSubscribeMessage(subscription)));
    });

    socket.addEventListener("message", (event) => {
      let message: unknown;

      try {
        message = JSON.parse(String(event.data));
      } catch {
        callbacks.onError("Received an invalid WebSocket message.");
        return;
      }

      if (!isRecord(message)) {
        callbacks.onError("Received an invalid WebSocket message.");
        return;
      }

      if (message.type === "subscription.confirmed") {
        const confirmed = message as SubscriptionConfirmedMessage;
        callbacks.onSubscriptionConfirmed(confirmed, hasConnectedOnce);
        hasConnectedOnce = true;
        reconnectAttempt = 0;
        callbacks.onStatusChange("connected");
        return;
      }

      if (message.type === "error") {
        const errorMessage = message as WebSocketErrorMessage;
        callbacks.onError(errorMessage.error?.message ?? "WebSocket subscription failed.");
        return;
      }

      if (isGameEvent(message)) {
        callbacks.onGameEvent(message);
        return;
      }

      callbacks.onError("Received an unsupported WebSocket message.");
    });

    socket.addEventListener("close", () => {
      socket = null;

      if (closedByClient) {
        callbacks.onStatusChange("disconnected");
        return;
      }

      callbacks.onStatusChange("reconnecting");
      const delay =
        RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
      reconnectAttempt += 1;
      reconnectTimer = globalThis.setTimeout(connect, delay);
    });

    socket.addEventListener("error", () => {
      callbacks.onError("WebSocket connection error.");
    });
  };

  connect();

  return {
    close: () => {
      closedByClient = true;
      clearReconnectTimer();
      socket?.close();
      socket = null;
      callbacks.onStatusChange("disconnected");
    },
  };
};
