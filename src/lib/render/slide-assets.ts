import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { bundledLanguages, codeToHtml } from "shiki";
import { resolveInside } from "@/lib/files/paths";
import type { CarouselContent } from "@/lib/schemas/carousel.schema";
import type { SlideAssets } from "@/templates/layout";
import type { SlideIssue } from "./render-carousel";

const ICON_DIR = path.join(process.cwd(), "node_modules", "lucide-static", "icons");
const LANG_ALIASES: Record<string, string> = {
  kt: "kotlin",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
};

async function highlight(code: string, language: string, lines: number[] = []): Promise<string> {
  const lang = LANG_ALIASES[language.toLowerCase()] ?? language.toLowerCase();
  return codeToHtml(code, {
    lang: lang in bundledLanguages ? lang : "text",
    theme: "github-dark",
    transformers: [
      {
        line(node, line) {
          if (lines.includes(line)) this.addClassToHast(node, "hl");
        },
      },
    ],
  });
}

/**
 * Load icons, highlighted code and mockup screenshots for a carousel.
 * Problems (unknown icon, missing screenshot) become warnings, never failures.
 */
export async function loadSlideAssets(
  content: CarouselContent,
  assetDir: string | undefined,
): Promise<{ assets: SlideAssets; issues: SlideIssue[] }> {
  const assets: SlideAssets = { icons: {}, code: {}, images: {} };
  const issues: SlideIssue[] = [];

  await Promise.all(
    content.slides.map(async (slide, i) => {
      const slideNumber = i + 2;
      if (slide.icon) {
        try {
          const svg = await readFile(path.join(ICON_DIR, `${slide.icon}.svg`), "utf8");
          assets.icons[slide.id] = svg.replace(/<!--[\s\S]*?-->/g, "").trim();
        } catch {
          issues.push({
            slide: slideNumber,
            message: `Unknown icon "${slide.icon}" (see lucide.dev/icons).`,
          });
        }
      }
      if (slide.type === "code") {
        const { before, after, language, highlightLines } = slide.code;
        assets.code[slide.id] = {
          before: before ? await highlight(before, language) : undefined,
          after: after ? await highlight(after, language, highlightLines) : undefined,
        };
      }
      if (slide.type === "mockup" && slide.mockup.image) {
        try {
          if (!assetDir) throw new Error("no asset dir");
          const buffer = await readFile(resolveInside(assetDir, slide.mockup.image));
          const jpeg = await sharp(buffer)
            .resize({ width: 900, withoutEnlargement: true })
            .jpeg({ quality: 88 })
            .toBuffer();
          assets.images[slide.id] = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
        } catch {
          issues.push({
            slide: slideNumber,
            message: `Screenshot "${slide.mockup.image}" not found in content/. Showing the generated screen instead.`,
          });
        }
      }
    }),
  );
  return { assets, issues };
}
