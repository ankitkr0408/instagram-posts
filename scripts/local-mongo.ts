/**
 * Run a local MongoDB without installing it system-wide (downloads a mongod binary once).
 * Data persists in ./data/mongo. Stop with Ctrl+C.
 *   npm run db:local
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const dbPath = path.resolve(process.env.LOCAL_MONGO_PATH ?? "data/mongo");
  const port = Number(process.env.LOCAL_MONGO_PORT ?? 27017);
  mkdirSync(dbPath, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { dbPath, port, storageEngine: "wiredTiger" },
  });
  console.log(`MongoDB running at ${server.getUri()} (data: ${dbPath}). Ctrl+C to stop.`);
  const stop = async () => {
    await server.stop({ doCleanup: false, force: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
