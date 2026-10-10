import "server-only";
import type { SlideIssue } from "@/lib/render/render-carousel";
import type { CarouselContent, Category } from "@/lib/schemas/carousel.schema";
import { getCollection } from "./mongodb";

export type ProjectStatus = "imported" | "rendered";

/** Metadata only. Images live on disk under OUTPUT_DIR/<id>/v<renderVersion>/. */
export type ProjectDocument = {
  _id: string;
  topic: string;
  category: Category;
  includePhoto: boolean;
  status: ProjectStatus;
  template: { name: string; version: string };
  content: CarouselContent;
  issues: SlideIssue[];
  warnings: string[];
  renderVersion: number; // 0 = never rendered
  outputFiles: string[]; // filenames inside the version dir
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectSummary = Pick<
  ProjectDocument,
  "_id" | "topic" | "category" | "status" | "createdAt" | "renderVersion"
>;

async function projects() {
  const collection = await getCollection<ProjectDocument>("projects");
  await collection.createIndex({ createdAt: -1 });
  return collection;
}

export async function insertProject(doc: ProjectDocument): Promise<void> {
  await (await projects()).insertOne(doc);
}

export async function getProject(id: string): Promise<ProjectDocument | null> {
  return (await projects()).findOne({ _id: id });
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<ProjectDocument, "_id" | "createdAt">>,
): Promise<ProjectDocument | null> {
  return (await projects()).findOneAndUpdate(
    { _id: id },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

/** Reserve the next render version number atomically. */
export async function nextRenderVersion(id: string): Promise<number> {
  const doc = await (
    await projects()
  ).findOneAndUpdate(
    { _id: id },
    { $inc: { renderVersion: 1 } },
    { returnDocument: "after", projection: { renderVersion: 1 } },
  );
  if (!doc) throw new Error("Project not found");
  return doc.renderVersion;
}

export async function listProjects(limit = 50): Promise<ProjectSummary[]> {
  const docs = await (
    await projects()
  )
    .find(
      {},
      {
        projection: { topic: 1, status: 1, createdAt: 1, renderVersion: 1, category: 1 },
      },
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => ({
    _id: d._id,
    topic: d.topic,
    status: d.status,
    createdAt: d.createdAt,
    renderVersion: d.renderVersion,
    category: d.category,
  }));
}
