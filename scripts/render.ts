/**
 * Render carousel JSON files straight to PNGs + ZIP. No database, no API calls.
 *
 *   npm run render -- content/my-post.json [more.json ...] [--template night-shift]
 *
 * Output: output/<file-name>/v<n>/ (earlier versions are kept).
 * Branding comes from content/brand.json if present: { name, handle, photo, focalX, focalY, zoom }.
 */
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { writeExports } from "@/lib/export/export-project";
import { sanitizeFilename } from "@/lib/files/paths";
import { photoDataUri, validatePhoto } from "@/lib/photo/photo";
import { closeBrowser, renderCarousel } from "@/lib/render/render-carousel";
import { parseCarouselFile } from "@/lib/schemas/carousel.schema";
import type { Branding } from "@/templates/layout";
import { TEMPLATE_NAMES } from "@/templates/themes";

const brandSchema = z.strictObject({
  name: z.string().max(40).default("Your Name"),
  handle: z.string().max(31).default("@yourhandle"),
  photo: z.string().optional(),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(35),
  zoom: z.number().min(1).max(2).default(1),
});

async function loadBranding(): Promise<Branding> {
  const file = path.resolve("content/brand.json");
  const brand = brandSchema.parse(existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : {});
  let photo: Branding["photo"] = null;
  if (brand.photo) {
    const photoPath = path.resolve(path.dirname(file), brand.photo);
    if (existsSync(photoPath)) {
      const buffer = await readFile(photoPath);
      await validatePhoto(buffer);
      photo = {
        src: await photoDataUri(buffer),
        focalX: brand.focalX,
        focalY: brand.focalY,
        zoom: brand.zoom,
      };
    } else {
      console.warn(`! Photo not found at ${photoPath}; using the photo-free cover.`);
    }
  }
  return { name: brand.name, handle: brand.handle, photo };
}

function nextVersionDir(base: string): string {
  const versions = existsSync(base)
    ? readdirSync(base).map((d) => Number(/^v(\d+)$/.exec(d)?.[1] ?? 0))
    : [];
  return path.join(base, `v${Math.max(0, ...versions) + 1}`);
}

async function main() {
  const args = process.argv.slice(2);
  const t = args.indexOf("--template");
  const templateOverride = t >= 0 ? args.splice(t, 2)[1] : undefined;
  if (templateOverride && !(TEMPLATE_NAMES as string[]).includes(templateOverride)) {
    throw new Error(
      `Unknown template "${templateOverride}". Use one of: ${TEMPLATE_NAMES.join(", ")}`,
    );
  }
  if (args.length === 0) throw new Error("Usage: npm run render -- content/<file>.json [...]");

  const branding = await loadBranding();
  let failed = 0;
  for (const input of args) {
    const result = parseCarouselFile(JSON.parse(await readFile(input, "utf8")));
    if (!result.success) {
      failed++;
      console.error(`✗ ${input}`);
      for (const issue of result.error.issues.slice(0, 10)) {
        console.error(`    ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
      continue;
    }
    const file = result.data;
    const template = (templateOverride ?? file.template) as (typeof TEMPLATE_NAMES)[number];
    const outDir = nextVersionDir(
      path.resolve("output", sanitizeFilename(path.basename(input, ".json"))),
    );
    const { files, issues } = await renderCarousel({
      content: file.content,
      template,
      branding: file.includePhoto ? branding : { ...branding, photo: null },
      outDir,
    });
    await writeExports(outDir, file.content, files);
    console.log(
      `✓ ${input} → ${path.relative(process.cwd(), outDir)}/ (${files.length} slides, ${template})`,
    );
    for (const issue of issues) console.log(`    ! slide ${issue.slide}: ${issue.message}`);
  }
  if (failed) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeBrowser);
