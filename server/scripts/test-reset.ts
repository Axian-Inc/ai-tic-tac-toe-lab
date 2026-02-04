import http from "http";

const port = Number(process.env.PORT ?? 3001);

function request(method: string, path: string) {
  return new Promise<{ status: number }>((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path,
        method,
      },
      (res) => {
        res.on("data", () => undefined);
        res.on("end", () => resolve({ status: res.statusCode ?? 0 }));
      }
    );

    req.on("error", (err) => reject(err));
    req.end();
  });
}

async function run() {
  const res = await request("POST", "/_test/reset");
  if (res.status !== 204) {
    throw new Error(`Expected 204, got ${res.status}`);
  }

  console.log("Test reset endpoint passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
