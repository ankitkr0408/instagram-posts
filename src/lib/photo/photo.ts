import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp, { type Metadata } from "sharp";
import { resolveInside } from "@/lib/files/paths";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const FILENAME_PATTERN = /^photo-\d{13}\.(jpeg|png|webp)$/;

export class PhotoError extends Error {}

/** Check the bytes really are an image we accept. Returns its format. */
export async function validatePhoto(buffer: Buffer): Promise<"jpeg" | "png" | "webp"> {
  if (buffer.byteLength === 0) throw new PhotoError("The file is empty.");
  if (buffer.byteLength > MAX_PHOTO_BYTES) throw new PhotoError("Photo must be 8 MB or smaller.");
  let meta: Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new PhotoError("That file is not a readable image.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new PhotoError("Use a JPEG, PNG or WebP photo.");
  }
  if ((meta.width ?? 0) < 400 || (meta.height ?? 0) < 400) {
    throw new PhotoError("Photo must be at least 400 × 400 px.");
  }
  return meta.format as "jpeg" | "png" | "webp";
}

/** Store an uploaded photo as a new file. Earlier uploads are kept, never overwritten. */
export async function savePhoto(dataDir: string, buffer: Buffer): Promise<string> {
  const format = await validatePhoto(buffer);
  const dir = resolveInside(dataDir, "creator");
  await mkdir(dir, { recursive: true });
  const filename = `photo-${Date.now()}.${format}`;
  await writeFile(resolveInside(dir, filename), buffer, { flag: "wx" });
  return filename;
}

export async function readPhoto(dataDir: string, filename: string): Promise<Buffer | null> {
  if (!FILENAME_PATTERN.test(filename)) return null;
  try {
    return await readFile(resolveInside(dataDir, "creator", filename));
  } catch {
    return null;
  }
}

/** Downscaled copy as a data URI for the renderer. The stored original is untouched. */
export async function photoDataUri(buffer: Buffer): Promise<string> {
  const jpeg = await sharp(buffer)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}
