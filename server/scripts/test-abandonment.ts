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

  const notAbandoned = await request("POST", `/games/${parsed.id}/abandonment-check`, {
    playerId: "p1",
  });
  if (notAbandoned.status !== 200 || !notAbandoned.body.includes("\"abandoned\":false")) {
    throw new Error("Expected not abandoned response");
  }

  const fourMinutesAgo = new Date(Date.now() - 4 * 60 * 1000).toISOString();
  const set = await request("POST", "/_test/set-last-move", {
    id: parsed.id,
    lastMoveAt: fourMinutesAgo,
  });
  if (set.status !== 204) {
    throw new Error(`Expected 204, got ${set.status}`);
  }

  const abandoned = await request("POST", `/games/${parsed.id}/abandonment-check`, {
    playerId: "p1",
  });
  if (abandoned.status !== 200) {
    throw new Error(`Expected 200, got ${abandoned.status}`);
  }
  if (!abandoned.body.includes("\"type\":\"abandoned\"")) {
    throw new Error("Expected abandoned event");
  }
  if (!abandoned.body.includes("\"reason\":\"abandon\"")) {
    throw new Error("Expected abandon reason");
  }
  if (!abandoned.body.includes("\"winner\":\"X\"")) {
    throw new Error("Expected winner X after O abandoned");
  }

  console.log("Abandonment check tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
