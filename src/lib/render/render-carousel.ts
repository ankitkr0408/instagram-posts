import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type Browser } from "playwright";
import sharp from "sharp";
import { fontFaceCss } from "@/lib/render/fonts";
import { resolveInside, slideFilename } from "@/lib/files/paths";
import type { CarouselContent } from "@/lib/schemas/carousel.schema";
import { CANVAS, renderSlideHtml, slideWordCount, type Branding } from "@/templates/layout";
import { loadSlideAssets } from "./slide-assets";
import { TEMPLATES, type TemplateName } from "@/templates/themes";

export type SlideIssue = { slide: number; message: string };

export type RenderResult = {
  files: string[]; // slide filenames, in order
  issues: SlideIssue[];
};

const globalForBrowser = globalThis as typeof globalThis & { __browser?: Promise<Browser> };

function getBrowser(): Promise<Browser> {
  globalForBrowser.__browser ??= chromium.launch().catch((error: unknown) => {
    globalForBrowser.__browser = undefined;
    throw error;
  });
  return globalForBrowser.__browser;
}

export async function closeBrowser(): Promise<void> {
  const browser = await globalForBrowser.__browser;
  globalForBrowser.__browser = undefined;
  await browser?.close();
}

/** Runs inside the page: report overflowing containers and broken images. */
function inspectLayout(): string[] {
  const problems: string[] = [];
  document.querySelectorAll<HTMLElement>("[data-fit]").forEach((el) => {
    if (el.scrollHeight > el.clientHeight + 1) {
      problems.push(
        `Text overflows the slide by ${el.scrollHeight - el.clientHeight}px. Shorten the copy.`,
      );
    }
  });
  document.querySelectorAll<HTMLElement>("[data-check-x]").forEach((el) => {
    if (el.scrollWidth > el.clientWidth + 1) {
      problems.push("A code line is too wide and is cut off. Shorten long lines.");
    }
  });
  document.querySelectorAll<HTMLImageElement>("img[data-check-image]").forEach((img) => {
    if (!img.complete || img.naturalWidth === 0) problems.push("An image failed to load.");
  });
  return problems;
}

export async function renderCarousel(options: {
  content: CarouselContent;
  template: TemplateName;
  branding: Branding;
  outDir: string;
  /** Folder that mockup screenshot paths are relative to (usually content/). */
  assetDir?: string;
  /** Render only this slide (1-based) for a quick preview. */
  only?: number;
}): Promise<RenderResult> {
  const { content, template, branding, outDir } = options;
  await mkdir(outDir, { recursive: true });
  const fonts = fontFaceCss();
  const theme = TEMPLATES[template].theme;

  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: CANVAS.width, height: CANVAS.height },
    deviceScaleFactor: 1,
  });
  // Slides are self-contained (inline fonts + data URI images). Block every network request.
  await context.route("**/*", (route) => route.abort());

  const files: string[] = [];
  const loaded = await loadSlideAssets(content, options.assetDir);
  const issues: SlideIssue[] = [...loaded.issues];
  if (theme.variant === "pop") {
    content.slides.forEach((slide, i) => {
      const words = slideWordCount(slide);
      if (words > 30) {
        issues.push({
          slide: i + 2,
          message: `${words} words. Bold Pop works best under 30; split or trim.`,
        });
      }
    });
  }
  try {
    const page = await context.newPage();
    const total = content.slides.length + 1;
    for (let index = 0; index < total; index++) {
      if (options.only && index + 1 !== options.only) continue;
      const slideHtml = renderSlideHtml(
        { content, theme, branding, index, assets: loaded.assets },
        fonts,
      );
      await page.setContent(slideHtml, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      for (const message of await page.evaluate(inspectLayout)) {
        issues.push({ slide: index + 1, message });
      }
      const png = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: CANVAS.width, height: CANVAS.height },
      });
      const meta = await sharp(png).metadata();
      if (meta.format !== "png" || meta.width !== CANVAS.width || meta.height !== CANVAS.height) {
        throw new Error(
          `Slide ${index + 1} rendered at ${meta.width}×${meta.height}, expected 1080×1350`,
        );
      }
      const name = slideFilename(index + 1);
      await writeFile(resolveInside(outDir, name), png);
      files.push(name);
    }
  } finally {
    await context.close();
  }
  return { files, issues: options.only ? issues.filter((i) => i.slide === options.only) : issues };
}

/** 3-column grid of thumbnails. */
export async function createContactSheet(outDir: string, slideFiles: string[]): Promise<string> {
  const cols = 3;
  const thumb = { width: 360, height: 450 };
  const gap = 24;
  const rows = Math.ceil(slideFiles.length / cols);
  const width = cols * thumb.width + (cols + 1) * gap;
  const height = rows * thumb.height + (rows + 1) * gap;

  const tiles = await Promise.all(
    slideFiles.map(async (file, i) => ({
      input: await sharp(resolveInside(outDir, file)).resize(thumb.width, thumb.height).toBuffer(),
      left: gap + (i % cols) * (thumb.width + gap),
      top: gap + Math.floor(i / cols) * (thumb.height + gap),
    })),
  );
  const name = "contact-sheet.png";
  await sharp({ create: { width, height, channels: 3, background: "#E9E4DA" } })
    .composite(tiles)
    .png()
    .toFile(resolveInside(outDir, name));
  return name;
}
