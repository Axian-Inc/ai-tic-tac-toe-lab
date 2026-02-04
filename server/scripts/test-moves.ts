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

  const preJoinMove = await request("POST", `/games/${parsed.id}/moves`, {
    playerId: "p1",
    index: 0,
  });
  if (preJoinMove.status !== 409 || !preJoinMove.body.includes("GAME_NOT_ACTIVE")) {
    throw new Error("Expected GAME_NOT_ACTIVE before join");
  }

  const joined = await request("POST", `/games/${parsed.id}/join`, { playerId: "p2" });
  if (joined.status !== 200) {
    throw new Error(`Expected 200, got ${joined.status}`);
  }

  const move1 = await request("POST", `/games/${parsed.id}/moves`, { playerId: "p1", index: 0 });
  if (move1.status !== 200 || !move1.body.includes("move_accepted")) {
    throw new Error("Expected move_accepted");
  }

  const moveOutOfTurn = await request("POST", `/games/${parsed.id}/moves`, {
    playerId: "p1",
    index: 1,
  });
  if (moveOutOfTurn.status !== 409 || !moveOutOfTurn.body.includes("NOT_YOUR_TURN")) {
    throw new Error("Expected NOT_YOUR_TURN");
  }

  const occupied = await request("POST", `/games/${parsed.id}/moves`, {
    playerId: "p2",
    index: 0,
  });
  if (occupied.status !== 409 || !occupied.body.includes("CELL_OCCUPIED")) {
    throw new Error("Expected CELL_OCCUPIED");
  }

  console.log("Move endpoint tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
