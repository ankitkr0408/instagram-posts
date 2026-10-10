import { mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listDrafts, readDraft } from "@/lib/drafts/drafts";
import { sampleCarousel } from "@/lib/fixtures/sample-carousel";
import { parseCarouselFile } from "@/lib/schemas/carousel.schema";

describe("carousel files", () => {
  it("accepts a full file or bare content, with defaults", () => {
    const bare = parseCarouselFile(sampleCarousel);
    expect(bare.success && bare.data).toMatchObject({
      template: "ship-it-right",
      category: "product-building",
      includePhoto: true,
    });
    const full = parseCarouselFile({ template: "night-shift", content: sampleCarousel });
    expect(full.success && full.data.template).toBe("night-shift");
  });

  it("rejects unknown templates and extra keys", () => {
    expect(parseCarouselFile({ template: "neon", content: sampleCarousel }).success).toBe(false);
    expect(parseCarouselFile({ content: sampleCarousel, html: "<b>" }).success).toBe(false);
  });

  it("every file in content/ is valid", async () => {
    const dir = path.resolve("content");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json") && f !== "brand.json");
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const result = parseCarouselFile(JSON.parse(await readFile(path.join(dir, f), "utf8")));
      expect(result.success ? "valid" : `${f}: ${result.error.issues[0].message}`).toBe("valid");
    }
  });
});

describe("drafts", () => {
  it("lists valid and invalid drafts and only reads safe names", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "drafts-"));
    await writeFile(path.join(dir, "good.json"), JSON.stringify(sampleCarousel));
    await writeFile(path.join(dir, "broken.json"), "{ nope");
    await writeFile(path.join(dir, "brand.json"), "{}");
    await writeFile(path.join(dir, "notes.txt"), "ignored");
    const drafts = await listDrafts(dir);
    expect(drafts).toEqual([
      { name: "broken.json", topic: null, error: "Not valid JSON" },
      { name: "good.json", topic: sampleCarousel.cover.headline, error: null },
    ]);
    expect(await readDraft(dir, "../package.json")).toBeNull();
    expect(await readDraft(dir, "missing.json")).toBeNull();
  });
});
