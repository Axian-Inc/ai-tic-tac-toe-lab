import http from "http";

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

async function listCount(path = "/games") {
  const listAll = await request("GET", path);
  if (listAll.status !== 200) {
    throw new Error(`Expected 200, got ${listAll.status}`);
  }
  const parsed = JSON.parse(listAll.body) as { games?: unknown[] };
  return parsed.games?.length ?? 0;
}

async function run() {
  const waiting = await listCount("/games?status=waiting");
  const active = await listCount("/games?status=active");
  const activeCount = waiting + active;
  if (activeCount >= 25) {
    const overLimit = await request("POST", "/games");
    if (overLimit.status !== 429 || !overLimit.body.includes("MAX_GAMES_REACHED")) {
      throw new Error(`Expected 429 MAX_GAMES_REACHED, got ${overLimit.status}`);
    }
    console.log("Create game endpoint tests passed (limit already reached).");
    return;
  }

  const toCreate = 25 - activeCount;
  let lastResponse = { status: 0, body: "" };
  for (let i = 0; i < toCreate; i += 1) {
    const response = await request("POST", "/games");
    if (response.status !== 201) {
      throw new Error(`Expected 201, got ${response.status}`);
    }
    lastResponse = response;
  }

  if (!lastResponse.body.includes("\"status\":\"waiting\"")) {
    throw new Error("Expected game status waiting in response");
  }

  const overLimit = await request("POST", "/games");
  if (overLimit.status !== 429 || !overLimit.body.includes("MAX_GAMES_REACHED")) {
    throw new Error(`Expected 429 MAX_GAMES_REACHED, got ${overLimit.status}`);
  }

  console.log("Create game endpoint tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
