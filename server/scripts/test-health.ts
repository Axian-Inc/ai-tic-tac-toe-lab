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
  const res = await request("GET", "/health");
  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }
  console.log("Server health check passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
