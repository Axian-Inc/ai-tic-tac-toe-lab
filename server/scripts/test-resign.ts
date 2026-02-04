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

  const resignWaiting = await request("POST", `/games/${parsed.id}/resign`, { playerId: "p1" });
  if (resignWaiting.status !== 409 || !resignWaiting.body.includes("GAME_NOT_ACTIVE")) {
    throw new Error("Expected GAME_NOT_ACTIVE for waiting game resign");
  }

  const joined = await request("POST", `/games/${parsed.id}/join`, { playerId: "p2" });
  if (joined.status !== 200) {
    throw new Error(`Expected 200, got ${joined.status}`);
  }

  const resigned = await request("POST", `/games/${parsed.id}/resign`, { playerId: "p1" });
  if (resigned.status !== 200) {
    throw new Error(`Expected 200, got ${resigned.status}`);
  }

  if (!resigned.body.includes("\"reason\":\"resign\"")) {
    throw new Error("Expected resign reason in response");
  }

  if (!resigned.body.includes("\"status\":\"over\"")) {
    throw new Error("Expected status over after resign");
  }

  if (!resigned.body.includes("\"winner\":\"O\"")) {
    throw new Error("Expected winner O after X resigns");
  }

  console.log("Resign endpoint tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
