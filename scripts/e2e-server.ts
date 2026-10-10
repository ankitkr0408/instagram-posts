/** Starts an in-memory MongoDB plus `next start` for UI tests, with the repo's content/ as drafts. */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const mongo = await MongoMemoryServer.create();
  const work = mkdtempSync(path.join(tmpdir(), "carousel-e2e-"));
  const app = spawn("npx", ["next", "start", "-p", process.env.E2E_PORT ?? "3200"], {
    stdio: "inherit",
    env: {
      ...process.env,
      CONTENT_DIR: path.resolve("content"),
      MONGODB_URI: mongo.getUri(),
      MONGODB_DB: "e2e",
      OUTPUT_DIR: path.join(work, "output"),
      DATA_DIR: path.join(work, "data"),
    },
  });
  const stop = async () => {
    app.kill();
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  app.on("exit", stop);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
