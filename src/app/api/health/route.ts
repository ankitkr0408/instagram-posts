import { connection } from "next/server";
import { pingDb } from "@/lib/db/mongodb";

export async function GET() {
  await connection();
  const database = await pingDb();
  return Response.json({ ok: database.ok, database }, { status: database.ok ? 200 : 503 });
}
