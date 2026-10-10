import { listProjects } from "@/lib/db/projects";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    return Response.json({ projects: await listProjects() });
  } catch (error) {
    return errorResponse(error);
  }
}
