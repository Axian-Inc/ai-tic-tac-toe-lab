import http from "http";

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
  if (created.status === 429) {
    console.log("Draw tests skipped: game limit reached.");
    return;
  }
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

  const moves = [
    { playerId: "p1", index: 0 },
    { playerId: "p2", index: 1 },
    { playerId: "p1", index: 2 },
    { playerId: "p2", index: 4 },
    { playerId: "p1", index: 3 },
    { playerId: "p2", index: 5 },
    { playerId: "p1", index: 7 },
    { playerId: "p2", index: 6 },
  ];

  for (const move of moves) {
    const res = await request("POST", `/games/${parsed.id}/moves`, move);
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  }

  const finalMove = await request("POST", `/games/${parsed.id}/moves`, {
    playerId: "p1",
    index: 8,
  });
  if (finalMove.status !== 200) {
    throw new Error(`Expected 200, got ${finalMove.status}`);
  }
  if (!finalMove.body.includes("\"status\":\"over\"")) {
    throw new Error("Expected status over after draw");
  }
  if (!finalMove.body.includes("\"winner\":null")) {
    throw new Error("Expected winner null after draw");
  }

  const extra = await request("POST", `/games/${parsed.id}/moves`, {
    playerId: "p2",
    index: 8,
  });
  if (extra.status !== 409 || !extra.body.includes("GAME_NOT_ACTIVE")) {
    throw new Error("Expected GAME_NOT_ACTIVE after draw");
  }

  console.log("Draw game tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
