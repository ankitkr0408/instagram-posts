import { getEnv } from "@/lib/config/env";
import { getSettings, saveSettings } from "@/lib/db/settings";
import { errorResponse, HttpError } from "@/lib/http";
import { MAX_PHOTO_BYTES, PhotoError, readPhoto, savePhoto } from "@/lib/photo/photo";

export async function GET() {
  try {
    const { photoFile } = await getSettings();
    const data = photoFile ? await readPhoto(getEnv().DATA_DIR, photoFile) : null;
    if (!data) return new Response("No photo", { status: 404 });
    const type = photoFile!.endsWith(".png")
      ? "image/png"
      : photoFile!.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Upload a new creator photo (multipart field "photo"). Previous uploads are kept on disk. */
export async function POST(req: Request) {
  try {
    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > MAX_PHOTO_BYTES + 64 * 1024)
      throw new HttpError(413, "Photo must be 8 MB or smaller.");
    const file = (await req.formData()).get("photo");
    if (!(file instanceof File)) throw new HttpError(400, "Choose a photo to upload.");
    if (file.size > MAX_PHOTO_BYTES) throw new HttpError(413, "Photo must be 8 MB or smaller.");
    const filename = await savePhoto(getEnv().DATA_DIR, Buffer.from(await file.arrayBuffer()));
    return Response.json({ settings: await saveSettings({ photoFile: filename }) });
  } catch (error) {
    if (error instanceof PhotoError)
      return Response.json({ error: error.message }, { status: 400 });
    return errorResponse(error);
  }
}
