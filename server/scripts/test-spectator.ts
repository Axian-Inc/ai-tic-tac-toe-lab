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

  const parsed = JSON.parse(created.body) as { id?: string };
  if (!parsed.id) {
    throw new Error("Expected id in create response");
  }

  const joined = await request("POST", `/games/${parsed.id}/join`, { playerId: "p2" });
  if (joined.status !== 200) {
    throw new Error(`Expected 200, got ${joined.status}`);
  }

  const move = await request("POST", `/games/${parsed.id}/moves`, { playerId: "p1", index: 0 });
  if (move.status !== 200) {
    throw new Error(`Expected 200, got ${move.status}`);
  }

  const spectatorMove = await request("POST", `/games/${parsed.id}/moves`, {
    playerId: "p3",
    index: 1,
  });
  if (spectatorMove.status !== 403 || !spectatorMove.body.includes("PLAYER_NOT_IN_GAME")) {
    throw new Error("Expected PLAYER_NOT_IN_GAME for spectator move");
  }

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws?gameId=${parsed.id}`);
    ws.on("message", (data) => {
      const text = data.toString();
      if (!text.includes("state_catchup")) {
        reject(new Error("Expected state_catchup message"));
        return;
      }
      if (!text.includes("\"index\":0")) {
        reject(new Error("Expected move history in catchup"));
        return;
      }
      ws.close();
      resolve();
    });
    ws.on("error", (err) => reject(err));
  });

  console.log("Spectator mode tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
