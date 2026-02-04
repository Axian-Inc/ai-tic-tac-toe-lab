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

function parseLastMoveAt(body: string): string {
  const parsed = JSON.parse(body) as { lastMoveAt?: string };
  if (!parsed.lastMoveAt) {
    throw new Error("Expected lastMoveAt in response");
  }
  return parsed.lastMoveAt;
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

  const initialState = await request("GET", `/games/${parsed.id}`);
  if (initialState.status !== 200) {
    throw new Error(`Expected 200, got ${initialState.status}`);
  }
  const initialLastMove = parseLastMoveAt(initialState.body);

  await new Promise((resolve) => setTimeout(resolve, 10));

  const joined = await request("POST", `/games/${parsed.id}/join`, { playerId: "p2" });
  if (joined.status !== 200) {
    throw new Error(`Expected 200, got ${joined.status}`);
  }

  const afterJoin = await request("GET", `/games/${parsed.id}`);
  const joinLastMove = parseLastMoveAt(afterJoin.body);
  if (Date.parse(joinLastMove) < Date.parse(initialLastMove)) {
    throw new Error("Expected lastMoveAt to advance after join");
  }

  await new Promise((resolve) => setTimeout(resolve, 10));

  const move = await request("POST", `/games/${parsed.id}/moves`, { playerId: "p1", index: 0 });
  if (move.status !== 200) {
    throw new Error(`Expected 200, got ${move.status}`);
  }

  const afterMove = await request("GET", `/games/${parsed.id}`);
  const moveLastMove = parseLastMoveAt(afterMove.body);
  if (Date.parse(moveLastMove) < Date.parse(joinLastMove)) {
    throw new Error("Expected lastMoveAt to advance after move");
  }

  console.log("Last move timestamp tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
