import http from "http";
import WebSocket from "ws";

const port = Number(process.env.PORT ?? 3001);

function request(method: string, path: string, body?: unknown) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode ?? 0, body: data });
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  const created = await request("POST", "/games", { playerId: "p1" });
  if (created.status !== 201) {
    throw new Error(`Expected 201, got ${created.status}`);
  }

  const gameId = (JSON.parse(created.body) as { id?: string }).id;
  if (!gameId) {
    throw new Error("Missing game id");
  }

  const joined = await request("POST", `/games/${gameId}/join`, { playerId: "p2" });
  if (joined.status !== 200) {
    throw new Error(`Expected 200, got ${joined.status}`);
  }

  const waitForType = (ws: WebSocket, type: string, timeoutMs = 2000) =>
    new Promise<{ type?: string }>((resolve, reject) => {
      const timer = setTimeout(() => {
        ws.off("message", onMessage);
        reject(new Error(`Timed out waiting for ${type}`));
      }, timeoutMs);

      const onMessage = (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString()) as { type?: string };
          if (message.type === type) {
            clearTimeout(timer);
            ws.off("message", onMessage);
            resolve(message);
          }
        } catch (err) {
          clearTimeout(timer);
          ws.off("message", onMessage);
          reject(err instanceof Error ? err : new Error("Invalid WS payload"));
        }
      };
      ws.on("message", onMessage);
      ws.on("error", (err) => reject(err));
    });

  await new Promise<void>((resolve, reject) => {
    const ws1 = new WebSocket(`ws://localhost:${port}/ws?gameId=${gameId}`);
    const ws2 = new WebSocket(`ws://localhost:${port}/ws?gameId=${gameId}`);

    Promise.all([waitForType(ws1, "state_catchup"), waitForType(ws2, "state_catchup")])
      .then(async () => {
        const ws1Move = waitForType(ws1, "move_accepted");
        const ws2Move = waitForType(ws2, "move_accepted");
        const move = await request("POST", `/games/${gameId}/moves`, { playerId: "p1", index: 0 });
        if (move.status !== 200) {
          throw new Error(`Expected 200, got ${move.status}`);
        }
        await Promise.all([ws1Move, ws2Move]);
        ws1.close();
        ws2.close();
        resolve();
      })
      .catch((err) => {
        ws1.close();
        ws2.close();
        reject(err);
      });
  });

  const moves = [
    { playerId: "p2", index: 3 },
    { playerId: "p1", index: 1 },
    { playerId: "p2", index: 4 },
    { playerId: "p1", index: 2 },
  ];
  for (const move of moves) {
    const res = await request("POST", `/games/${gameId}/moves`, move);
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  }

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws?gameId=${gameId}`);
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as {
          type?: string;
          payload?: {
            status?: string;
            moves?: { index: number; mark: string; turn: number }[];
            board?: (string | null)[];
            currentTurn?: string;
            winner?: string | null;
          };
        };
        if (message.type !== "state_catchup" || !message.payload) {
          reject(new Error("Expected state_catchup message"));
          return;
        }
        if (message.payload.status !== "over") {
          reject(new Error("Expected status over in catch-up"));
          return;
        }
        if (message.payload.winner !== "X") {
          reject(new Error("Expected winner X in catch-up"));
          return;
        }
        if (!message.payload.board || message.payload.board.length !== 9) {
          reject(new Error("Expected board state in catch-up"));
          return;
        }
        if (!message.payload.moves || message.payload.moves.length !== 5) {
          reject(new Error("Expected move history in catch-up"));
          return;
        }
        if (message.payload.moves[0]?.index !== 0) {
          reject(new Error("Expected move history to be ordered"));
          return;
        }
        if (!message.payload.currentTurn) {
          reject(new Error("Expected current turn in catch-up"));
          return;
        }
        ws.close();
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Invalid catch-up payload"));
      }
    });
    ws.on("error", (err) => reject(err));
  });

  await new Promise<void>((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    ws.on("close", (code, reason) => {
      if (code !== 1008 || reason.toString() !== "missing gameId") {
        console.error(`Expected close 1008 missing gameId, got ${code} ${reason}`);
        process.exit(1);
      }
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws?gameId=missing`);
    ws.on("close", (code, reason) => {
      if (code !== 1008 || reason.toString() !== "game not found") {
        console.error(`Expected close 1008 game not found, got ${code} ${reason}`);
        process.exit(1);
      }
      resolve();
    });
  });

  console.log("WebSocket endpoint tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
