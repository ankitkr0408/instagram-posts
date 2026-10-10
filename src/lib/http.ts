import "server-only";
import type { z } from "zod";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Read and validate a JSON body with a size cap. */
export async function readJson<S extends z.ZodType>(
  request: Request,
  schema: S,
  maxBytes = 256 * 1024,
): Promise<z.infer<S>> {
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, "Request body is too large.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body must be JSON.");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new HttpError(
      400,
      `Invalid request: ${first.path.join(".") || "body"}: ${first.message}`,
    );
  }
  return result.data;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : String(error);
  console.error("[api]", message);
  if (/ECONNREFUSED|Server selection timed out/i.test(message)) {
    return Response.json(
      { error: "Cannot reach MongoDB. Check MONGODB_URI and that MongoDB is running." },
      { status: 503 },
    );
  }
  return Response.json({ error: "Something went wrong. Check the server log." }, { status: 500 });
}
