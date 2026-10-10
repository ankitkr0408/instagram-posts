import "server-only";
import { readdir, readFile } from "node:fs/promises";
import { resolveInside } from "@/lib/files/paths";
import { parseCarouselFile } from "@/lib/schemas/carousel.schema";

const DRAFT_NAME = /^[a-z0-9][a-z0-9-]{0,80}\.json$/;

export type DraftSummary = { name: string; topic: string | null; error: string | null };

/** Carousel JSON files in CONTENT_DIR (written by hand or by Claude Code). */
export async function listDrafts(contentDir: string): Promise<DraftSummary[]> {
  let names: string[];
  try {
    names = (await readdir(contentDir))
      .filter((n) => DRAFT_NAME.test(n) && n !== "brand.json")
      .sort();
  } catch {
    return [];
  }
  return Promise.all(
    names.map(async (name) => {
      const text = (await readDraft(contentDir, name)) ?? "";
      try {
        const result = parseCarouselFile(JSON.parse(text));
        if (result.success) {
          return {
            name,
            topic: result.data.topic ?? result.data.content.cover.headline,
            error: null,
          };
        }
        const first = result.error.issues[0];
        return { name, topic: null, error: `${first.path.join(".")}: ${first.message}` };
      } catch {
        return { name, topic: null, error: "Not valid JSON" };
      }
    }),
  );
}

export async function readDraft(contentDir: string, name: string): Promise<string | null> {
  if (!DRAFT_NAME.test(name)) return null;
  try {
    return await readFile(resolveInside(contentDir, name), "utf8");
  } catch {
    return null;
  }
}
