/**
 * Render carousel JSON files straight to PNGs + ZIP. No database, no API calls.
 *
 *   npm run render -- content/my-post.json [more.json ...]
 *     --slide 1            render only that slide (quick preview, no ZIP)
 *     --template bold-pop  override the template in the file
 *     --brand file.json    branding file (default content/brand.json)
 *
 * Output: output/<file-name>/ (overwritten on each run).
 * brand.json: { "name", "handle", "photo" (path relative to brand.json), "focalX", "focalY", "zoom" }
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { writeExports } from "@/lib/export/export-project";
import { sanitizeFilename } from "@/lib/files/paths";
import { photoDataUri, validatePhoto } from "@/lib/photo/photo";
import { closeBrowser, renderCarousel } from "@/lib/render/render-carousel";
import { parseCarouselFile } from "@/lib/schemas/carousel.schema";
import { findDuplicateTopics } from "@/lib/topics/duplicate-topic";
import type { Branding } from "@/templates/layout";
import { TEMPLATE_NAMES, type TemplateName } from "@/templates/themes";

const brandSchema = z.strictObject({
  name: z.string().max(40).default("Your Name"),
  handle: z.string().max(31).default("@yourhandle"),
  photo: z.string().optional(),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(35),
  zoom: z.number().min(1).max(2).default(1),
});

async function loadBranding(file: string): Promise<Branding> {
  const brand = brandSchema.parse(existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : {});
  if (!brand.photo) return { name: brand.name, handle: brand.handle, photo: null };
  const photoPath = path.resolve(path.dirname(file), brand.photo);
  if (!existsSync(photoPath)) {
    console.warn(`! Photo not found at ${photoPath}; using the photo-free layout.`);
    return { name: brand.name, handle: brand.handle, photo: null };
  }
  const buffer = await readFile(photoPath);
  await validatePhoto(buffer);
  const { focalX, focalY, zoom } = brand;
  return {
    name: brand.name,
    handle: brand.handle,
    photo: { src: await photoDataUri(buffer), focalX, focalY, zoom },
  };
}

/** Topics of the other carousel files next to `input`, for the duplicate warning. */
async function otherTopics(input: string): Promise<string[]> {
  const dir = path.dirname(path.resolve(input));
  const names = (await readdir(dir)).filter(
    (f) => f.endsWith(".json") && f !== "brand.json" && f !== path.basename(input),
  );
  const topics = await Promise.all(
    names.map(async (f) => {
      const parsed = parseCarouselFile(JSON.parse(await readFile(path.join(dir, f), "utf8")));
      return parsed.success ? (parsed.data.topic ?? parsed.data.content.cover.headline) : null;
    }),
  );
  return topics.filter((t): t is string => t !== null);
}

/** Pull `--name value` out of args. */
function takeFlag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const template = takeFlag(args, "--template") as TemplateName | undefined;
  const brandFile = path.resolve(takeFlag(args, "--brand") ?? "content/brand.json");
  const slideArg = takeFlag(args, "--slide");
  const only = slideArg ? Number(slideArg) : undefined;
  if (template && !TEMPLATE_NAMES.includes(template)) {
    throw new Error(`Unknown template "${template}". Use one of: ${TEMPLATE_NAMES.join(", ")}`);
  }
  if (only !== undefined && !(Number.isInteger(only) && only >= 1))
    throw new Error("--slide needs a number like 1");
  if (args.length === 0)
    throw new Error("Usage: npm run render -- content/<file>.json [--slide 1]");

  const branding = await loadBranding(brandFile);
  for (const input of args) {
    const result = parseCarouselFile(JSON.parse(await readFile(input, "utf8")));
    if (!result.success) {
      process.exitCode = 1;
      console.error(`✗ ${input}`);
      for (const issue of result.error.issues.slice(0, 10)) {
        console.error(`    ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
      continue;
    }
    const file = result.data;
    const topic = file.topic ?? file.content.cover.headline;
    const [dupe] = findDuplicateTopics(topic, await otherTopics(input));
    if (dupe) console.warn(`! Similar to an earlier carousel: "${dupe.topic}"`);
    const outDir = path.resolve("output", sanitizeFilename(path.basename(input, ".json")));
    await mkdir(outDir, { recursive: true });
    if (!only) {
      // Full render replaces the previous one, so drop slides that may no longer exist.
      for (const f of await readdir(outDir))
        if (/^slide-\d+\.png$/.test(f)) await rm(path.join(outDir, f));
    }
    const { files, issues } = await renderCarousel({
      content: file.content,
      template: template ?? file.template,
      branding: file.includePhoto ? branding : { ...branding, photo: null },
      outDir,
      assetDir: path.dirname(path.resolve(input)),
      color: file.color,
      only,
    });
    if (!only) await writeExports(outDir, file.content, files);
    const shown = files.map((f) => path.relative(process.cwd(), path.join(outDir, f)));
    console.log(
      `✓ ${input} → ${only ? shown[0] : `${path.relative(process.cwd(), outDir)}/ (${files.length} slides)`}`,
    );
    for (const issue of issues) console.log(`    ! slide ${issue.slide}: ${issue.message}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeBrowser);
