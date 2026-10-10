import { randomBytes } from "node:crypto";
import path from "node:path";

const PROJECT_ID_PATTERN = /^\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{8}$/;

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

/** Collision-resistant, human-scannable id: `20261010-topic-slug-a1b2c3d4`. */
export function createProjectId(topic: string, now: Date = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `${date}-${sanitizeFilename(topic, 40)}-${randomBytes(4).toString("hex")}`;
}

export function isValidProjectId(id: string): boolean {
  return PROJECT_ID_PATTERN.test(id);
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

export function projectOutputDir(outputDir: string, projectId: string): string {
  if (!isValidProjectId(projectId)) throw new Error("Invalid project id");
  return resolveInside(outputDir, projectId);
}
