import "server-only";
import sharp from "sharp";
import { getEnv } from "@/lib/config/env";
import {
  insertProject,
  nextRenderVersion,
  updateProject,
  type ProjectDocument,
} from "@/lib/db/projects";
import { getSettings } from "@/lib/db/settings";
import { writeExports } from "@/lib/export/export-project";
import { createProjectId, projectOutputDir, resolveInside } from "@/lib/files/paths";
import { photoDataUri, readPhoto } from "@/lib/photo/photo";
import { renderCarousel } from "@/lib/render/render-carousel";
import type { CarouselContent, CarouselFile } from "@/lib/schemas/carousel.schema";
import type { Branding } from "@/templates/layout";
import { TEMPLATES, type TemplateName } from "@/templates/themes";
import type { PipelineEvent, StageId } from "./events";

type Emit = (stage: StageId) => void;

export class PipelineError extends Error {}

/** Stream stage events as NDJSON. `run` returns the project id on success. */
export function pipelineResponse(run: (emit: Emit) => Promise<string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let current: StageId | null = null;
      const send = (event: PipelineEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      const emit: Emit = (stage) => {
        if (stage !== current) send({ type: "stage", stage });
        current = stage;
      };
      try {
        send({ type: "done", projectId: await run(emit) });
      } catch (error) {
        console.error(
          `[pipeline] failed at ${current ?? "start"}:`,
          error instanceof Error ? error.message : error,
        );
        send({ type: "error", stage: current, message: userMessage(error) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

export function userMessage(error: unknown): string {
  if (error instanceof PipelineError) return error.message;
  const message = error instanceof Error ? error.message : "";
  if (/ECONNREFUSED|Server selection timed out/i.test(message)) {
    return "Cannot reach MongoDB. Run `npm run db:local` or check MONGODB_URI.";
  }
  if (/Executable doesn't exist|browserType.launch/i.test(message)) {
    return "Chromium is not installed. Run: npx playwright install chromium";
  }
  if (/EACCES|EPERM/.test(message)) return "No permission to write output files. Check OUTPUT_DIR.";
  return "Something went wrong. Check the server log for details.";
}

/** Load the creator photo per settings. Missing photo → photo-free layout plus a warning. */
async function loadBranding(
  includePhoto: boolean,
): Promise<{ branding: Branding; warnings: string[] }> {
  const settings = await getSettings();
  const warnings: string[] = [];
  let photo: Branding["photo"] = null;
  if (includePhoto) {
    const buffer = settings.photoFile
      ? await readPhoto(getEnv().DATA_DIR, settings.photoFile)
      : null;
    if (buffer) {
      const { focalX, focalY, zoom } = settings;
      photo = { src: await photoDataUri(buffer), focalX, focalY, zoom };
    } else {
      warnings.push(
        settings.photoFile
          ? "Creator photo file is missing. Used the photo-free cover; re-upload it in Settings."
          : "No creator photo set. Used the photo-free cover; add one in Settings.",
      );
    }
  }
  return { branding: { name: settings.name, handle: settings.handle, photo }, warnings };
}

/** Render a new version of the project: render → check → export. Earlier versions are kept. */
export async function renderProject(
  project: ProjectDocument,
  emit: Emit,
): Promise<ProjectDocument> {
  emit("render");
  const { branding, warnings } = await loadBranding(project.includePhoto);
  const version = await nextRenderVersion(project._id);
  const outDir = resolveInside(projectOutputDir(getEnv().OUTPUT_DIR, project._id), `v${version}`);
  const { files, issues } = await renderCarousel({
    content: project.content,
    template: project.template.name as TemplateName,
    branding,
    outDir,
  });

  emit("check");
  for (const file of files) {
    const meta = await sharp(resolveInside(outDir, file)).metadata();
    if (meta.width !== 1080 || meta.height !== 1350) {
      throw new PipelineError(`${file} has the wrong size.`);
    }
  }

  emit("export");
  const outputFiles = await writeExports(outDir, project.content, files);
  const updated = await updateProject(project._id, {
    status: "rendered",
    renderVersion: version,
    outputFiles,
    issues,
    warnings,
  });
  if (!updated) throw new PipelineError("Project disappeared while rendering.");
  return updated;
}

/** Create a project from a validated carousel file and render it. */
export async function runImport(file: CarouselFile, emit: Emit): Promise<string> {
  emit("validate");
  const topic = file.topic ?? file.content.cover.headline;
  const now = new Date();
  const project: ProjectDocument = {
    _id: createProjectId(topic),
    topic,
    category: file.category,
    includePhoto: file.includePhoto,
    status: "imported",
    template: { name: file.template, version: TEMPLATES[file.template].version },
    content: file.content,
    issues: [],
    warnings: [],
    renderVersion: 0,
    outputFiles: [],
    createdAt: now,
    updatedAt: now,
  };
  await insertProject(project);
  await renderProject(project, emit);
  return project._id;
}

/** Save edited content and render it. */
export async function runRerender(
  projectId: string,
  content: CarouselContent,
  template: TemplateName,
  emit: Emit,
): Promise<string> {
  emit("validate");
  const project = await updateProject(projectId, {
    content,
    template: { name: template, version: TEMPLATES[template].version },
  });
  if (!project) throw new PipelineError("Project not found.");
  await renderProject(project, emit);
  return projectId;
}
