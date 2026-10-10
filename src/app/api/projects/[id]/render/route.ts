import { z } from "zod";
import { isValidProjectId } from "@/lib/files/paths";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { pipelineResponse, runRerender } from "@/lib/pipeline/pipeline";
import { carouselContentSchema } from "@/lib/schemas/carousel.schema";
import { TEMPLATE_NAMES } from "@/templates/themes";

const bodySchema = z.strictObject({
  content: carouselContentSchema,
  template: z.enum(TEMPLATE_NAMES),
});

/** Save edited content and render it. No AI call. */
export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/render">) {
  try {
    const { id } = await ctx.params;
    if (!isValidProjectId(id)) throw new HttpError(400, "Invalid project id.");
    const { content, template } = await readJson(req, bodySchema);
    return pipelineResponse((emit) => runRerender(id, content, template, emit));
  } catch (error) {
    return errorResponse(error);
  }
}
