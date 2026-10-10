import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { PhotoError, photoDataUri, validatePhoto } from "@/lib/photo/photo";

const image = (width: number, height: number, format: "png" | "jpeg" | "gif" = "png") =>
  sharp({ create: { width, height, channels: 3, background: "#88aacc" } })
    .toFormat(format)
    .toBuffer();

describe("creator photo", () => {
  it("accepts real JPEG/PNG images", async () => {
    expect(await validatePhoto(await image(800, 1000, "jpeg"))).toBe("jpeg");
    expect(await validatePhoto(await image(400, 400))).toBe("png");
  });

  it("rejects non-images, wrong formats and tiny images", async () => {
    await expect(validatePhoto(Buffer.from("<svg onload=alert(1)>"))).rejects.toBeInstanceOf(
      PhotoError,
    );
    await expect(validatePhoto(await image(800, 800, "gif"))).rejects.toThrow(/JPEG, PNG or WebP/);
    await expect(validatePhoto(await image(100, 100))).rejects.toThrow(/300/);
    await expect(validatePhoto(Buffer.alloc(0))).rejects.toThrow(/empty/);
  });

  it("produces a downscaled JPEG data URI", async () => {
    const uri = await photoDataUri(await image(3000, 3000));
    expect(uri.startsWith("data:image/jpeg;base64,")).toBe(true);
    const meta = await sharp(Buffer.from(uri.split(",")[1], "base64")).metadata();
    expect(meta.width).toBe(1400);
  });
});
