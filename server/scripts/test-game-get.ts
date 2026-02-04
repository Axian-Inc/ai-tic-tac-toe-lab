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

  const state = await request("GET", `/games/${parsed.id}`);
  if (state.status !== 200) {
    throw new Error(`Expected 200, got ${state.status}`);
  }

  const body = state.body;
  if (!body.includes("\"status\":\"active\"")) {
    throw new Error("Expected status active in state");
  }
  if (!body.includes("\"winner\":null")) {
    throw new Error("Expected winner null in state");
  }
  if (!body.includes("\"createdAt\"") || !body.includes("\"updatedAt\"")) {
    throw new Error("Expected timestamps in state");
  }
  if (!body.includes("\"moves\"") || !body.includes("\"board\"")) {
    throw new Error("Expected moves and board in state");
  }
  if (!body.includes("\"index\":0")) {
    throw new Error("Expected move history in state");
  }

  const missing = await request("GET", "/games/missing");
  if (missing.status !== 404 || !missing.body.includes("NOT_FOUND")) {
    throw new Error("Expected NOT_FOUND for missing game");
  }

  console.log("Get game endpoint tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
