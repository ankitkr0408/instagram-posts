import path from "node:path";

/**
 * Reduce arbitrary text to a safe filename segment: lowercase ASCII letters,
 * digits and single dashes. Never returns an empty string.
 */
export function sanitizeFilename(input: string, maxLength = 60): string {
  const slug = input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "untitled";
}

/** `slide-01.png`, `slide-12.png` */
export function slideFilename(index: number): string {
  if (!Number.isInteger(index) || index < 1 || index > 99) {
    throw new RangeError(`Invalid slide index: ${index}`);
  }
  return `slide-${String(index).padStart(2, "0")}.png`;
}

/**
 * Resolve a path inside `baseDir`, rejecting anything that escapes it
 * (`..`, absolute paths, symlink-looking tricks in the string itself).
 */
export function resolveInside(baseDir: string, ...segments: string[]): string {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, ...segments);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error("Path escapes the allowed directory");
  }
  return target;
}
