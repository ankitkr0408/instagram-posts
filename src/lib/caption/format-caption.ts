import { LIMITS, type CaptionContent } from "@/lib/schemas/carousel.schema";

/** Normalize to `#tag`, drop invalid ones, dedupe case-insensitively, cap the count. */
export function normalizeHashtags(tags: string[], max: number = LIMITS.hashtagCount): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const body = raw
      .trim()
      .replace(/^#+/, "")
      .replace(/[^\p{L}\p{N}_]/gu, "");
    if (!body) continue;
    const key = body.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(`#${body}`);
    if (result.length >= max) break;
  }
  return result;
}

/** Plain-text caption ready to paste into Instagram: body, CTA, then hashtags. */
export function formatCaption(content: CaptionContent): string {
  const hashtags = normalizeHashtags(content.hashtags);
  return [content.caption.trim(), content.cta.trim(), hashtags.join(" ")]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}
