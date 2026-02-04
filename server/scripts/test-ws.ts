import http from "http";
import WebSocket from "ws";

const port = Number(process.env.PORT ?? 3001);

function request(method: string, path: string) {
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
    if (method === "POST") {
      req.write("{}");
    }
    req.end();
  });
}

async function run() {
  const created = await request("POST", "/games");
  if (created.status !== 201) {
    throw new Error(`Expected 201, got ${created.status}`);
  }

  const gameId = (JSON.parse(created.body) as { id?: string }).id;
  if (!gameId) {
    throw new Error("Missing game id");
  }

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws?gameId=${gameId}`);
    ws.on("message", (data) => {
      const text = data.toString();
      if (!text.includes("state_catchup")) {
        reject(new Error("Expected state_catchup message"));
        return;
      }
      ws.close();
      resolve();
    });
    ws.on("error", (err) => reject(err));
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
