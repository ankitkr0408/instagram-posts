import { access } from "node:fs/promises";
import { getEnv } from "@/lib/config/env";
import { getProject } from "@/lib/db/projects";
import { isValidProjectId, projectOutputDir, resolveInside } from "@/lib/files/paths";
import { errorResponse, HttpError } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  try {
    const { id } = await ctx.params;
    if (!isValidProjectId(id)) throw new HttpError(400, "Invalid project id.");
    const project = await getProject(id);
    if (!project) throw new HttpError(404, "Project not found.");

    // Report output files that were deleted from disk instead of serving broken links.
    let filesMissing = false;
    if (project.renderVersion > 0 && project.outputFiles.length) {
      const dir = resolveInside(
        projectOutputDir(getEnv().OUTPUT_DIR, id),
        `v${project.renderVersion}`,
      );
      filesMissing = await access(resolveInside(dir, project.outputFiles[0])).then(
        () => false,
        () => true,
      );
    }
    return Response.json({ project, filesMissing });
  } catch (error) {
    return errorResponse(error);
  }
}
