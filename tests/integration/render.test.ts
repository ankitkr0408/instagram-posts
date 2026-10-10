import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { sampleCarousel } from "@/lib/fixtures/sample-carousel";
import { photoDataUri } from "@/lib/photo/photo";
import { closeBrowser, renderCarousel } from "@/lib/render/render-carousel";
import {
  parseCarouselFile,
  SLIDE_TYPES,
  type CarouselContent,
} from "@/lib/schemas/carousel.schema";
import { renderSlideHtml } from "@/templates/layout";
import { TEMPLATES, TEMPLATE_NAMES } from "@/templates/themes";

const branding = { name: "Test", handle: "@test", photo: null };
const tmp = () => mkdtemp(path.join(tmpdir(), "render-"));

/** Bold Pop example: statement, stat, steps, dodont, mockup, highlighted code, icons. */
const popCarousel = parseCarouselFile(
  JSON.parse(readFileSync(path.resolve("content/play-store-pop.json"), "utf8")),
).data!.content;

afterAll(closeBrowser);

describe("renderCarousel", () => {
  it("the two fixtures cover every slide type", () => {
    const types = new Set([...sampleCarousel.slides, ...popCarousel.slides].map((s) => s.type));
    expect([...types].sort()).toEqual([...SLIDE_TYPES].sort());
  });

  it.each(TEMPLATE_NAMES)("renders every slide type at 1080×1350 with %s", async (template) => {
    for (const content of [sampleCarousel, popCarousel]) {
      const outDir = await tmp();
      const { files, issues } = await renderCarousel({ content, template, branding, outDir });
      expect(files).toHaveLength(content.slides.length + 1);
      // Wordy classic content is expected to be flagged in Bold Pop (bigger type).
      if (template !== "bold-pop" || content === popCarousel) expect(issues).toEqual([]);
      for (const file of files) {
        const meta = await sharp(path.join(outDir, file)).metadata();
        expect([meta.format, meta.width, meta.height]).toEqual(["png", 1080, 1350]);
      }
    }
  });

  it("warns about wordy slides in Bold Pop", async () => {
    const { issues } = await renderCarousel({
      content: sampleCarousel,
      template: "bold-pop",
      branding,
      outDir: await tmp(),
    });
    expect(issues.some((i) => /words\. Bold Pop/.test(i.message))).toBe(true);
  });

  it("flags overflowing text instead of shrinking or silently clipping it", async () => {
    const content: CarouselContent = structuredClone(sampleCarousel);
    content.slides[0] = {
      id: "long",
      type: "content",
      title: "W".repeat(70),
      description: "A long description that keeps going. ".repeat(7).slice(0, 280),
      bullets: Array(6).fill(
        "A long bullet point that wraps onto a second line on the rendered slide ok",
      ),
      tip: "T".repeat(160),
    };
    const { issues } = await renderCarousel({
      content,
      template: "ship-it-right",
      branding,
      outDir: await tmp(),
    });
    expect(issues).toContainEqual({ slide: 2, message: expect.stringMatching(/overflows/) });
  });

  it("flags code lines that are too wide", async () => {
    const content: CarouselContent = structuredClone(sampleCarousel);
    content.slides[2] = {
      id: "code",
      type: "code",
      title: "Wide",
      code: { language: "ts", after: "x".repeat(120) },
    };
    const { issues } = await renderCarousel({
      content,
      template: "ship-it-right",
      branding,
      outDir: await tmp(),
    });
    expect(issues).toContainEqual({ slide: 4, message: expect.stringMatching(/code line/) });
  });

  it("warns (not fails) on unknown icons and missing screenshots", async () => {
    const content: CarouselContent = structuredClone(popCarousel);
    content.slides[1].icon = "not-a-real-icon";
    const mock = content.slides.find((s) => s.type === "mockup");
    if (mock?.type !== "mockup") throw new Error("fixture missing mockup");
    mock.mockup.image = "assets/missing.png";
    const { files, issues } = await renderCarousel({
      content,
      template: "bold-pop",
      branding,
      outDir: await tmp(),
      assetDir: path.resolve("content"),
    });
    expect(files).toHaveLength(content.slides.length + 1);
    const messages = issues.map((i) => i.message).join("\n");
    expect(messages).toMatch(/Unknown icon/);
    expect(messages).toMatch(/Screenshot "assets\/missing.png" not found/);
  });

  it("shows no image without a photo, and the footer avatar with one", async () => {
    const theme = TEMPLATES["ship-it-right"].theme;
    const noPhoto = renderSlideHtml({ content: sampleCarousel, theme, branding, index: 0 }, "");
    expect(noPhoto).not.toContain("<img");

    const png = await sharp({
      create: { width: 600, height: 800, channels: 3, background: "#336699" },
    })
      .png()
      .toBuffer();
    const photo = { src: await photoDataUri(png), focalX: 50, focalY: 30, zoom: 1.2 };
    for (const template of TEMPLATE_NAMES) {
      const { issues } = await renderCarousel({
        content: popCarousel,
        template,
        branding: { ...branding, photo },
        outDir: await tmp(),
      });
      expect(issues).toEqual([]); // the image loaded and nothing overflowed
    }
  });
});
