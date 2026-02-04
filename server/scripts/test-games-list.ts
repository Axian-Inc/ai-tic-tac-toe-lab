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

async function run() {
  const created = await request("POST", "/games");
  if (created.status !== 201) {
    throw new Error(`Expected 201, got ${created.status}`);
  }

  const listAll = await request("GET", "/games");
  if (listAll.status !== 200) {
    throw new Error(`Expected 200, got ${listAll.status}`);
  }
  if (!listAll.body.includes("\"status\":\"waiting\"")) {
    throw new Error("Expected waiting game in list");
  }

  const listWaiting = await request("GET", "/games?status=waiting");
  if (listWaiting.status !== 200) {
    throw new Error(`Expected 200, got ${listWaiting.status}`);
  }

  const listInvalid = await request("GET", "/games?status=unknown");
  if (listInvalid.status !== 400 || !listInvalid.body.includes("INVALID_STATUS")) {
    throw new Error("Expected 400 INVALID_STATUS");
  }

  console.log("List games endpoint tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
