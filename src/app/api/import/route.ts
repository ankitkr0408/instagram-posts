import { errorResponse, HttpError } from "@/lib/http";
import { pipelineResponse, runImport } from "@/lib/pipeline/pipeline";
import { parseCarouselFile } from "@/lib/schemas/carousel.schema";

/** Import a carousel file (or bare content JSON) as a new project and render it. */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 256 * 1024) throw new HttpError(413, "Content is too large.");
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new HttpError(400, "That is not valid JSON.");
    }
    const result = parseCarouselFile(body);
    if (!result.success) {
      const first = result.error.issues[0];
      throw new HttpError(
        400,
        `Invalid content: ${first.path.join(".") || "root"}: ${first.message}`,
      );
    }
    return pipelineResponse((emit) => runImport(result.data, emit));
  } catch (error) {
    return errorResponse(error);
  }
}
