import "server-only";
import { z } from "zod";
import { getCollection } from "./mongodb";

export const creatorSettingsSchema = z.strictObject({
  name: z.string().trim().max(40).default("Your Name"),
  handle: z
    .string()
    .trim()
    .max(31)
    .regex(/^@?[A-Za-z0-9._]*$/, "Handles use letters, numbers, dots and underscores")
    .transform((h) => (h && !h.startsWith("@") ? `@${h}` : h))
    .default("@yourhandle"),
  photoFile: z.string().nullable().default(null),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(35),
  zoom: z.number().min(1).max(2).default(1),
});
export type CreatorSettings = z.infer<typeof creatorSettingsSchema>;

type SettingsDoc = CreatorSettings & { _id: "creator" };

export async function getSettings(): Promise<CreatorSettings> {
  const doc = await (await getCollection<SettingsDoc>("settings")).findOne({ _id: "creator" });
  const { _id, ...rest } = doc ?? { _id: "creator" };
  void _id;
  return creatorSettingsSchema.parse(rest);
}

export async function saveSettings(patch: Partial<CreatorSettings>): Promise<CreatorSettings> {
  const next = creatorSettingsSchema.parse({ ...(await getSettings()), ...patch });
  await (
    await getCollection<SettingsDoc>("settings")
  ).updateOne({ _id: "creator" }, { $set: next }, { upsert: true });
  return next;
}
