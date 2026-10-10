import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveInside, sanitizeFilename, slideFilename } from "@/lib/files/paths";

describe("sanitizeFilename", () => {
  it("produces lowercase dash slugs", () => {
    expect(sanitizeFilename("  Stop Leaking API Keys!! ")).toBe("stop-leaking-api-keys");
    expect(sanitizeFilename("Café déjà vu")).toBe("cafe-deja-vu");
  });

  it("strips path traversal and separators", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeFilename("a\\b/c")).toBe("a-b-c");
  });

  it("never returns empty and respects max length", () => {
    expect(sanitizeFilename("!!!")).toBe("untitled");
    expect(sanitizeFilename("a".repeat(100), 10)).toHaveLength(10);
    expect(sanitizeFilename("abcd efgh", 5)).toBe("abcd");
  });
});

describe("output paths", () => {
  it("keeps resolved paths inside the base dir", () => {
    const base = path.resolve("/tmp/out");
    expect(resolveInside(base, "abc", "slide-01.png")).toBe(path.join(base, "abc", "slide-01.png"));
    expect(() => resolveInside(base, "..", "etc")).toThrow();
    expect(() => resolveInside(base, "/etc/passwd")).toThrow();
    expect(() => resolveInside(base, "../out-evil")).toThrow();
  });

  it("formats slide filenames", () => {
    expect(slideFilename(1)).toBe("slide-01.png");
    expect(slideFilename(12)).toBe("slide-12.png");
    expect(() => slideFilename(0)).toThrow();
  });
});
