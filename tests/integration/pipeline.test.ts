import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getProject, listProjects } from "@/lib/db/projects";
import { closeDb } from "@/lib/db/mongodb";
import { readPipeline, type PipelineEvent } from "@/lib/pipeline/events";
import { pipelineResponse, runImport, runRerender } from "@/lib/pipeline/pipeline";
import { closeBrowser } from "@/lib/render/render-carousel";
import { sampleCarousel } from "@/lib/fixtures/sample-carousel";
import { parseCarouselFile, type CarouselFile } from "@/lib/schemas/carousel.schema";

let mongo: MongoMemoryServer;
let outputDir: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  outputDir = await mkdtemp(path.join(tmpdir(), "pipeline-out-"));
  // getEnv() reads these lazily on first use.
  Object.assign(process.env, {
    MONGODB_URI: mongo.getUri(),
    MONGODB_DB: "test",
    OUTPUT_DIR: outputDir,
    DATA_DIR: await mkdtemp(path.join(tmpdir(), "pipeline-data-")),
  });
});

afterAll(async () => {
  await closeBrowser();
  await closeDb();
  await mongo?.stop();
});

const file: CarouselFile = parseCarouselFile({
  topic: "Ship a secure Next.js app",
  category: "launch-checklists",
  content: sampleCarousel,
}).data!;

async function run(fn: Parameters<typeof pipelineResponse>[0]) {
  const events: PipelineEvent[] = [];
  await readPipeline(pipelineResponse(fn), (e) => events.push(e));
  return events;
}

describe("import pipeline (real renderer and MongoDB)", () => {
  let projectId: string;

  it("streams real stages and produces a complete 9-slide export", async () => {
    const events = await run((emit) => runImport(file, emit));
    expect(
      events.filter((e) => e.type === "stage").map((e) => e.type === "stage" && e.stage),
    ).toEqual(["validate", "render", "check", "export"]);
    const done = events.at(-1);
    expect(done?.type).toBe("done");
    projectId = done?.type === "done" ? done.projectId : "";

    const project = await getProject(projectId);
    expect(project?.status).toBe("rendered");
    expect(project?.renderVersion).toBe(1);
    expect(project?.warnings[0]).toMatch(/No creator photo/);

    const dir = path.join(outputDir, projectId, "v1");
    const expected = [
      ...Array.from({ length: 9 }, (_, i) => `slide-0${i + 1}.png`),
      "contact-sheet.png",
      "caption.txt",
      "content.json",
      "carousel.zip",
    ];
    expect(project?.outputFiles).toEqual(expected);
    for (const f of expected) expect((await stat(path.join(dir, f))).size).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(await readFile(path.join(dir, "carousel.zip")));
    expect(Object.keys(zip.files).sort()).toEqual(
      expected.filter((f) => f !== "carousel.zip").sort(),
    );
    const json = JSON.parse(await zip.file("content.json")!.async("string"));
    expect(json.cover.headline).toBe(sampleCarousel.cover.headline);
    expect(await zip.file("caption.txt")!.async("string")).toMatch(/#webdev/);
  });

  it("persists projects and lists them", async () => {
    const list = await listProjects();
    expect(list.map((p) => p.topic)).toContain(file.topic);
  });

  it("rerenders edited content and keeps the previous export", async () => {
    const project = (await getProject(projectId))!;
    const content = structuredClone(project.content);
    content.cover.headline = "Edited headline";
    const events = await run((emit) => runRerender(projectId, content, "night-shift", emit));
    expect(events.map((e) => (e.type === "stage" ? e.stage : e.type))).toEqual([
      "validate",
      "render",
      "check",
      "export",
      "done",
    ]);

    const updated = (await getProject(projectId))!;
    expect(updated.renderVersion).toBe(2);
    expect(updated.content.cover.headline).toBe("Edited headline");
    expect(updated.template.name).toBe("night-shift");
    await stat(path.join(outputDir, projectId, "v1", "carousel.zip")); // still there
  });

  it("uses the headline as the topic when none is given", async () => {
    const bare = parseCarouselFile(sampleCarousel).data!;
    const events = await run((emit) => runImport(bare, emit));
    const done = events.at(-1);
    const project = await getProject(done?.type === "done" ? done.projectId : "");
    expect(project?.topic).toBe(sampleCarousel.cover.headline);
    expect(project?.template.name).toBe("ship-it-right");
  });
});
