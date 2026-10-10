import "server-only";
import { readFile, writeFile } from "node:fs/promises";
import JSZip from "jszip";
import { formatCaption } from "@/lib/caption/format-caption";
import { resolveInside } from "@/lib/files/paths";
import { createContactSheet } from "@/lib/render/render-carousel";
import type { CarouselContent } from "@/lib/schemas/carousel.schema";

const EXPORT_FILES = {
  contactSheet: "contact-sheet.png",
  caption: "caption.txt",
  content: "content.json",
  zip: "carousel.zip",
} as const;

/** Write contact sheet, caption, JSON and a ZIP of everything. Returns all filenames in the dir. */
export async function writeExports(
  outDir: string,
  content: CarouselContent,
  slideFiles: string[],
): Promise<string[]> {
  const contactSheet = await createContactSheet(outDir, slideFiles);
  await writeFile(resolveInside(outDir, EXPORT_FILES.caption), formatCaption(content.caption));
  await writeFile(
    resolveInside(outDir, EXPORT_FILES.content),
    JSON.stringify(content, null, 2) + "\n",
  );

  const zip = new JSZip();
  const entries = [...slideFiles, contactSheet, EXPORT_FILES.caption, EXPORT_FILES.content];
  for (const name of entries) zip.file(name, await readFile(resolveInside(outDir, name)));
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(resolveInside(outDir, EXPORT_FILES.zip), buffer);

  return [...entries, EXPORT_FILES.zip];
}
