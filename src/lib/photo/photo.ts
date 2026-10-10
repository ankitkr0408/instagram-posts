import sharp, { type Metadata } from "sharp";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

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
  if ((meta.width ?? 0) < 300 || (meta.height ?? 0) < 300) {
    throw new PhotoError("Photo must be at least 300 × 300 px.");
  }
  return meta.format as "jpeg" | "png" | "webp";
}

/** Downscaled, lightly enhanced copy as a data URI for the renderer. The original file is untouched. */
export async function photoDataUri(buffer: Buffer): Promise<string> {
  const jpeg = await sharp(buffer)
    .rotate() // respect phone EXIF orientation
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    // Gentle touch-up so the face reads well next to bold colors.
    .modulate({ saturation: 1.06, brightness: 1.02 })
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}
