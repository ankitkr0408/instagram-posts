import "server-only";
import { MongoClient, type Collection, type Db, type Document } from "mongodb";
import { getEnv } from "@/lib/config/env";

// Reuse one client across Next.js dev hot reloads.
const globalForMongo = globalThis as typeof globalThis & {
  __mongoClientPromise?: Promise<MongoClient>;
};

function getClient(): Promise<MongoClient> {
  globalForMongo.__mongoClientPromise ??= new MongoClient(getEnv().MONGODB_URI, {
    serverSelectionTimeoutMS: 3_000,
  })
    .connect()
    .catch((error: unknown) => {
      // Allow a later retry instead of caching the rejected promise forever.
      globalForMongo.__mongoClientPromise = undefined;
      throw error;
    });
  return globalForMongo.__mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  return (await getClient()).db(getEnv().MONGODB_DB);
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  return (await getDb()).collection<T>(name);
}

export async function closeDb(): Promise<void> {
  const client = await globalForMongo.__mongoClientPromise?.catch(() => undefined);
  globalForMongo.__mongoClientPromise = undefined;
  await client?.close();
}

export async function pingDb(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await (await getDb()).command({ ping: 1 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown database error" };
  }
}
