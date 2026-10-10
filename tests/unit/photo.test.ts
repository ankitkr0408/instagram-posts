import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { PhotoError, readPhoto, savePhoto, validatePhoto } from "@/lib/photo/photo";

const image = (width: number, height: number, format: "png" | "jpeg" | "gif" = "png") =>
  sharp({ create: { width, height, channels: 3, background: "#88aacc" } })
    .toFormat(format)
    .toBuffer();

describe("creator photo", () => {
  it("accepts real JPEG/PNG images", async () => {
    expect(await validatePhoto(await image(800, 1000, "jpeg"))).toBe("jpeg");
    expect(await validatePhoto(await image(800, 800))).toBe("png");
  });

  it("rejects non-images, wrong formats and tiny images", async () => {
    await expect(validatePhoto(Buffer.from("<svg onload=alert(1)>"))).rejects.toBeInstanceOf(
      PhotoError,
    );
    await expect(validatePhoto(await image(800, 800, "gif"))).rejects.toThrow(/JPEG, PNG or WebP/);
    await expect(validatePhoto(await image(100, 100))).rejects.toThrow(/400/);
    await expect(validatePhoto(Buffer.alloc(0))).rejects.toThrow(/empty/);
  });

  it("stores each upload as a new file and never overwrites", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "photo-"));
    const a = await savePhoto(dir, await image(500, 500));
    await new Promise((r) => setTimeout(r, 2));
    const b = await savePhoto(dir, await image(600, 600));
    expect(a).not.toBe(b);
    expect(await readdir(path.join(dir, "creator"))).toHaveLength(2);
    expect(await readPhoto(dir, a)).toBeInstanceOf(Buffer);
  });

  it("refuses to read arbitrary paths", async () => {
    expect(await readPhoto("/tmp", "../../etc/passwd")).toBeNull();
  });
});
