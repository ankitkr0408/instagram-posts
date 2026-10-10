import "server-only";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017"),
  MONGODB_DB: z
    .string()
    .regex(/^[A-Za-z0-9_-]+$/)
    .default("carousel_studio"),
  OUTPUT_DIR: z.string().default("./output"),
  DATA_DIR: z.string().default("./data"),
  CONTENT_DIR: z.string().default("./content"),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    // Report only the variable names, never their values.
    const keys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration: ${keys}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

export function getEnv(): ServerEnv {
  cached ??= parseEnv(process.env);
  return cached;
}
