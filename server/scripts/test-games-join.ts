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
  const created = await request("POST", "/games", {});
  if (created.status !== 201) {
    throw new Error(`Expected 201, got ${created.status}`);
  }

  const parsed = JSON.parse(created.body) as { id?: string };
  if (!parsed.id) {
    throw new Error("Expected id in create response");
  }

  const joined = await request("POST", `/games/${parsed.id}/join`, { playerId: "player-2" });
  if (joined.status !== 200 || !joined.body.includes("player_joined")) {
    throw new Error("Expected player_joined event");
  }

  if (!joined.body.includes("\"status\":\"active\"")) {
    throw new Error("Expected status active after join");
  }

  if (!joined.body.includes("\"mark\":\"X\"")) {
    throw new Error("Expected creator X");
  }

  if (!joined.body.includes("\"mark\":\"O\"")) {
    throw new Error("Expected joiner O");
  }

  const secondJoin = await request("POST", `/games/${parsed.id}/join`, { playerId: "player-3" });
  if (secondJoin.status !== 409 || !secondJoin.body.includes("NOT_JOINABLE")) {
    throw new Error("Expected NOT_JOINABLE on second join");
  }

  console.log("Join game endpoint tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
