import { connection } from "next/server";
import { getEnv } from "@/lib/config/env";
import { listDrafts } from "@/lib/drafts/drafts";

export async function GET() {
  await connection();
  return Response.json({ drafts: await listDrafts(getEnv().CONTENT_DIR) });
}
