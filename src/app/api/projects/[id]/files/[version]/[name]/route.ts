import { readFile } from "node:fs/promises";
import { getEnv } from "@/lib/config/env";
import { isValidProjectId, projectOutputDir, resolveInside } from "@/lib/files/paths";

const ALLOWED = /^(slide-\d{2}\.png|contact-sheet\.png|caption\.txt|content\.json|carousel\.zip)$/;
const TYPES: Record<string, string> = {
  png: "image/png",
  txt: "text/plain; charset=utf-8",
  json: "application/json; charset=utf-8",
  zip: "application/zip",
};

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/projects/[id]/files/[version]/[name]">,
) {
  const { id, version, name } = await ctx.params;
  if (!isValidProjectId(id) || !/^v\d{1,4}$/.test(version) || !ALLOWED.test(name)) {
    return new Response("Not found", { status: 404 });
  }
  let data: Buffer;
  try {
    data = await readFile(resolveInside(projectOutputDir(getEnv().OUTPUT_DIR, id), version, name));
  } catch {
    return new Response("File is missing from the output folder.", { status: 404 });
  }
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": TYPES[name.split(".").pop()!],
      "Cache-Control": "private, max-age=31536000, immutable",
      ...(download ? { "Content-Disposition": `attachment; filename="${id}-${name}"` } : {}),
    },
  });
}
