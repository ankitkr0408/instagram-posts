import { getSettings, saveSettings, creatorSettingsSchema } from "@/lib/db/settings";
import { errorResponse, readJson } from "@/lib/http";

const patchSchema = creatorSettingsSchema.omit({ photoFile: true }).partial();

export async function GET() {
  try {
    return Response.json({ settings: await getSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: Request) {
  try {
    const patch = await readJson(req, patchSchema, 4096);
    return Response.json({ settings: await saveSettings(patch) });
  } catch (error) {
    return errorResponse(error);
  }
}
