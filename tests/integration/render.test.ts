import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { sampleCarousel } from "@/lib/fixtures/sample-carousel";
import { closeBrowser, renderCarousel } from "@/lib/render/render-carousel";
import { photoDataUri } from "@/lib/photo/photo";
import type { CarouselContent } from "@/lib/schemas/carousel.schema";
import { renderSlideHtml } from "@/templates/layout";
import { TEMPLATES, TEMPLATE_NAMES } from "@/templates/themes";

const branding = { name: "Test", handle: "@test", photo: null };
const tmp = () => mkdtemp(path.join(tmpdir(), "render-"));

afterAll(closeBrowser);

describe("renderCarousel", () => {
  it.each(TEMPLATE_NAMES)("renders every slide type at 1080×1350 with %s", async (template) => {
    const types = new Set(["cover", ...sampleCarousel.slides.map((s) => s.type)]);
    expect(types).toEqual(
      new Set(["cover", "content", "code", "comparison", "checklist", "closing"]),
    );

    const outDir = await tmp();
    const { files, issues } = await renderCarousel({
      content: sampleCarousel,
      template,
      branding,
      outDir,
    });
    expect(files).toHaveLength(9);
    expect(issues).toEqual([]);
    for (const file of files) {
      const meta = await sharp(path.join(outDir, file)).metadata();
      expect([meta.format, meta.width, meta.height]).toEqual(["png", 1080, 1350]);
    }
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

  it("uses the photo-free cover when there is no photo, and the photo when there is", async () => {
    const theme = TEMPLATES["ship-it-right"].theme;
    const noPhoto = renderSlideHtml({ content: sampleCarousel, theme, branding, index: 0 }, "");
    expect(noPhoto).toContain("noPhoto");
    expect(noPhoto).not.toContain("<img");

    const png = await sharp({
      create: { width: 600, height: 800, channels: 3, background: "#336699" },
    })
      .png()
      .toBuffer();
    const photo = { src: await photoDataUri(png), focalX: 50, focalY: 30, zoom: 1.2 };
    const outDir = await tmp();
    const { issues } = await renderCarousel({
      content: sampleCarousel,
      template: "ship-it-right",
      branding: { ...branding, photo },
      outDir,
    });
    expect(issues).toEqual([]); // the image loaded
  });
});
