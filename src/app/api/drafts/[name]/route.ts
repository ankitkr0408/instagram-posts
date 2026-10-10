import { getEnv } from "@/lib/config/env";
import { readDraft } from "@/lib/drafts/drafts";

export async function GET(_req: Request, ctx: RouteContext<"/api/drafts/[name]">) {
  const { name } = await ctx.params;
  const text = await readDraft(getEnv().CONTENT_DIR, name);
  if (text === null) return new Response("Not found", { status: 404 });
  return new Response(text, { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
