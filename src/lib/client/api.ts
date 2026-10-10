import { readPipeline, type PipelineEvent } from "@/lib/pipeline/events";
import type { CarouselContent, Category } from "@/lib/schemas/carousel.schema";
import type { SlideIssue } from "@/lib/render/render-carousel";

/** Client-side shape of a project (dates arrive as ISO strings). */
export type ProjectView = {
  _id: string;
  topic: string;
  category: Category;
  includePhoto: boolean;
  status: "imported" | "rendered";
  template: { name: string; version: string };
  content: CarouselContent;
  issues: SlideIssue[];
  warnings: string[];
  renderVersion: number;
  outputFiles: string[];
  createdAt: string;
};

export type ProjectSummaryView = Pick<
  ProjectView,
  "_id" | "topic" | "category" | "status" | "createdAt" | "renderVersion"
>;

export type DraftView = { name: string; topic: string | null; error: string | null };

async function json<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

/** POST that streams pipeline events. Resolves with the final event (done or error). */
async function streamPipeline(url: string, body: string, onEvent: (e: PipelineEvent) => void) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) await json(res); // throws with the server message
  let last: PipelineEvent | null = null;
  await readPipeline(res, (event) => {
    last = event;
    onEvent(event);
  });
  return last as PipelineEvent | null;
}

export const api = {
  listProjects: () =>
    fetch("/api/projects").then((r) => json<{ projects: ProjectSummaryView[] }>(r)),
  listDrafts: () => fetch("/api/drafts").then((r) => json<{ drafts: DraftView[] }>(r)),
  readDraft: async (name: string) => {
    const res = await fetch(`/api/drafts/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error("Could not read that draft.");
    return res.text();
  },
  getProject: (id: string) =>
    fetch(`/api/projects/${id}`).then((r) =>
      json<{ project: ProjectView; filesMissing: boolean }>(r),
    ),
  importCarousel: (jsonText: string, onEvent: (e: PipelineEvent) => void) =>
    streamPipeline("/api/import", jsonText, onEvent),
  rerender: (
    id: string,
    content: CarouselContent,
    template: string,
    onEvent: (e: PipelineEvent) => void,
  ) => streamPipeline(`/api/projects/${id}/render`, JSON.stringify({ content, template }), onEvent),
};

export function fileUrl(
  project: Pick<ProjectView, "_id" | "renderVersion">,
  name: string,
  download = false,
) {
  return `/api/projects/${project._id}/files/v${project.renderVersion}/${name}${download ? "?download" : ""}`;
}
