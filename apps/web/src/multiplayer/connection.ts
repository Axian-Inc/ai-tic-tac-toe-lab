import type { MultiplayerApi } from './api';
import type { GameEvent, GameSnapshot } from './types';

interface SubscriptionAccepted {
  version: 1;
  type: 'subscription.accepted';
  gameId: string;
  throughSequence: number;
  snapshot: GameSnapshot;
}

interface LiveGameEvent {
  version: 1;
  type: 'game.event';
  gameId: string;
  sequence: number;
  state: GameSnapshot;
}

type ServerMessage = SubscriptionAccepted | LiveGameEvent | { type: 'subscription.rejected'; detail?: string };

export interface MultiplayerConnectionOptions {
  api: MultiplayerApi;
  webSocketUrl: string;
  gameId: string;
  initialSnapshot: GameSnapshot;
  onSnapshot: (snapshot: GameSnapshot) => void;
  onStatus: (status: 'connecting' | 'live' | 'recovering' | 'offline') => void;
  onError: (message: string) => void;
  socketFactory?: (url: string) => WebSocket;
}

export class MultiplayerConnection {
  private socket: WebSocket | null = null;
  private snapshot: GameSnapshot;
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private recovery: Promise<void> | null = null;
  private subscriptionCount = 0;
  private readonly buffered = new Map<number, GameSnapshot>();

  constructor(private readonly options: MultiplayerConnectionOptions) {
    this.snapshot = options.initialSnapshot;
  }

  start() {
    this.stopped = false;
    this.connect();
  }

  stop() {
    this.stopped = true;
    if (this.reconnectTimer !== undefined) globalThis.clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
  }

  acceptSnapshot(snapshot: GameSnapshot) {
    if (snapshot.sequence < this.snapshot.sequence) return;
    this.snapshot = snapshot;
    this.options.onSnapshot(snapshot);
    this.drainBuffer();
  }

  private connect() {
    if (this.stopped) return;
    this.options.onStatus('connecting');
    const socket = (this.options.socketFactory ?? ((url) => new WebSocket(url)))(this.options.webSocketUrl);
    this.socket = socket;

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({
        version: 1,
        action: 'subscribe',
        requestId: crypto.randomUUID(),
        gameId: this.options.gameId,
        afterSequence: this.snapshot.sequence,
      }));
    });
    socket.addEventListener('message', (event) => this.receive(event.data));
    socket.addEventListener('error', () => this.options.onStatus('offline'));
    socket.addEventListener('close', () => {
      if (this.stopped) return;
      this.options.onStatus('offline');
      this.reconnectTimer = globalThis.setTimeout(() => this.connect(), 1500);
    });
  }

  private receive(raw: unknown) {
    let message: ServerMessage;
    try {
      message = JSON.parse(String(raw)) as ServerMessage;
    } catch {
      this.options.onError('A live update could not be read. Reconnecting will recover the game.');
      return;
    }

    if (message.type === 'subscription.rejected') {
      this.options.onError(message.detail ?? 'The live game subscription was rejected.');
      return;
    }
    if (message.gameId !== this.options.gameId) return;

    if (message.type === 'subscription.accepted') {
      const reconnecting = this.subscriptionCount > 0;
      this.subscriptionCount += 1;
      if (message.snapshot.sequence > this.snapshot.sequence) {
        this.buffered.set(message.snapshot.sequence, message.snapshot);
      }
      // A newly observed boundary must be closed with durable events before
      // live delivery resumes. Reconnects replay even when the boundary is
      // unchanged so a disconnect cannot silently hide a missed event.
      if (this.snapshot.sequence < message.throughSequence || reconnecting) void this.recover();
      else this.options.onStatus('live');
      return;
    }

    this.acceptEvent(message);
  }

  private acceptEvent(event: Pick<GameEvent, 'sequence' | 'state'>) {
    if (event.sequence <= this.snapshot.sequence) return;
    if (event.sequence === this.snapshot.sequence + 1) {
      this.acceptSnapshot(event.state);
      this.options.onStatus('live');
      return;
    }
    this.buffered.set(event.sequence, event.state);
    void this.recover();
  }

  private drainBuffer() {
    let next = this.buffered.get(this.snapshot.sequence + 1);
    while (next) {
      this.buffered.delete(next.sequence);
      this.snapshot = next;
      this.options.onSnapshot(next);
      next = this.buffered.get(this.snapshot.sequence + 1);
    }
  }

  private recover(): Promise<void> {
    if (this.recovery) return this.recovery;
    this.options.onStatus('recovering');
    this.recovery = this.replayAll()
      .then(() => this.options.onStatus('live'))
      .catch(() => this.options.onError('Live updates are delayed. The client will retry after reconnecting.'))
      .finally(() => { this.recovery = null; });
    return this.recovery;
  }

  private async replayAll() {
    let cursor: string | undefined;
    do {
      const page = await this.options.api.getEvents(this.options.gameId, this.snapshot.sequence, cursor);
      for (const event of page.items) this.acceptEvent(event);
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
  }
}
