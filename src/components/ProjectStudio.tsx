"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, fileUrl, type ProjectView } from "@/lib/client/api";
import { formatCaption } from "@/lib/caption/format-caption";
import type { PipelineEvent, StageId } from "@/lib/pipeline/events";
import { validateCarousel, type CarouselContent } from "@/lib/schemas/carousel.schema";
import { TEMPLATES, TEMPLATE_NAMES, type TemplateName } from "@/templates/themes";
import { CarouselEditor } from "./CarouselEditor";
import {
  GenerationProgress,
  idleProgress,
  progressReducer,
  type ProgressState,
} from "./GenerationProgress";

const RENDER_STAGES: StageId[] = ["validate", "render", "check", "export"];
const slideFilename = (n: number) => `slide-${String(n).padStart(2, "0")}.png`;

export function ProjectStudioRoute() {
  const { id } = useParams<{ id: string }>();
  return <ProjectStudio key={id} id={id} />;
}

export function ProjectStudio({ id }: { id: string }) {
  const [project, setProject] = useState<ProjectView | null>(null);
  const [filesMissing, setFilesMissing] = useState(false);
  const [content, setContent] = useState<CarouselContent | null>(null);
  const [template, setTemplate] = useState<TemplateName>("ship-it-right");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(idleProgress);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const apply = useCallback((result: Awaited<ReturnType<typeof api.getProject>>) => {
    setProject(result.project);
    setFilesMissing(result.filesMissing);
    setContent(result.project.content);
    setTemplate(result.project.template.name as TemplateName);
    setDirty(false);
  }, []);
  const load = () => api.getProject(id).then(apply);

  useEffect(() => {
    api.getProject(id).then(apply, (e: Error) => setError(e.message));
  }, [id, apply]);

  if (!project || !content) {
    return <p className="text-sm text-muted">{error ?? "Loading project…"}</p>;
  }

  const validation = validateCarousel(content);
  const total = content.slides.length + 1;

  function onEvent(e: PipelineEvent) {
    if (e.type === "stage") setProgress((p) => progressReducer(p, e.stage));
    if (e.type === "error") setProgress((p) => ({ ...p, failed: true }));
  }

  async function rerender() {
    setBusy(true);
    setError(null);
    setNotice(null);
    setProgress(idleProgress);
    try {
      const last = await api.rerender(id, content!, template, onEvent);
      if (last?.type === "done") {
        await load();
        setProgress(idleProgress);
      } else {
        // Keep the user's edits; only report the failure.
        setError(last?.type === "error" ? last.message : "Stopped unexpectedly.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const rendered = project.renderVersion > 0 && !filesMissing;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.topic}</h1>
          <p className="text-sm text-muted">
            {project.content.slides.length + 1} slides · edits rerender locally, no API calls
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Template"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            value={template}
            onChange={(e) => {
              setTemplate(e.target.value as TemplateName);
              setDirty(true);
            }}
          >
            {TEMPLATE_NAMES.map((t) => (
              <option key={t} value={t}>
                {TEMPLATES[t].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={rerender}
            disabled={busy || !validation.ok}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Rendering…" : "Save & rerender"}
          </button>
        </div>
      </header>

      <GenerationProgress state={progress} include={RENDER_STAGES} />
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error} Your edits are kept.
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm"
        >
          {notice}
        </p>
      )}
      {!validation.ok && (
        <div role="alert" className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm">
          Fix before rerendering:
          <ul className="list-disc pl-5">
            {validation.issues.slice(0, 6).map((i) => (
              <li key={i.path + i.message}>
                {i.path}: {i.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {project.warnings.map((w) => (
        <p key={w} className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm">
          {w}
        </p>
      ))}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <CarouselEditor
          content={content}
          onChange={(c) => {
            setContent(c);
            setDirty(true);
          }}
        />

        <div className="flex flex-col gap-6">
          {dirty && rendered && (
            <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
              Preview shows the last render. Use “Save &amp; rerender” to apply your edits (no AI
              call).
            </p>
          )}
          {filesMissing && (
            <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm">
              The output files for this project are missing from disk. Rerender to recreate them.
            </p>
          )}

          {rendered && (
            <>
              <section aria-label="Preview" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.outputFiles
                  .filter((f) => f.startsWith("slide-"))
                  .map((file, i) => {
                    const issues = project.issues.filter((x) => x.slide === i + 1);
                    return (
                      <figure key={file} className="flex flex-col gap-1">
                        <a href={fileUrl(project, file)} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element -- local generated PNGs */}
                          <img
                            src={fileUrl(project, file)}
                            alt={`Slide ${i + 1}`}
                            width={1080}
                            height={1350}
                            className={`h-auto w-full rounded-lg border ${issues.length ? "border-danger" : "border-border"}`}
                          />
                        </a>
                        <figcaption className="text-xs text-muted">
                          {i + 1} /{" "}
                          {project.outputFiles.filter((f) => f.startsWith("slide-")).length}
                          {issues.map((x) => (
                            <span key={x.message} className="block text-danger">
                              {x.message}
                            </span>
                          ))}
                        </figcaption>
                      </figure>
                    );
                  })}
              </section>

              <section
                aria-label="Export"
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <h2 className="text-sm font-semibold">Export (render v{project.renderVersion})</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <a
                    className="rounded-lg bg-accent px-4 py-2 font-semibold text-white"
                    href={fileUrl(project, "carousel.zip", true)}
                  >
                    Download ZIP
                  </a>
                  {["contact-sheet.png", "caption.txt", "content.json"].map((f) => (
                    <a
                      key={f}
                      className="rounded-lg border border-border px-3 py-2"
                      href={fileUrl(project, f, true)}
                    >
                      {f}
                    </a>
                  ))}
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-2"
                    onClick={() =>
                      navigator.clipboard.writeText(formatCaption(project.content.caption)).then(
                        () => setNotice("Caption copied."),
                        () => setError("Could not access the clipboard."),
                      )
                    }
                  >
                    Copy caption
                  </button>
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted">Individual slides</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.from({ length: total }, (_, i) => slideFilename(i + 1)).map((f) => (
                      <a key={f} className="underline" href={fileUrl(project, f, true)}>
                        {f}
                      </a>
                    ))}
                  </div>
                </details>
                {/* eslint-disable-next-line @next/next/no-img-element -- local generated PNG */}
                <img
                  src={fileUrl(project, "contact-sheet.png")}
                  alt="Contact sheet of all slides"
                  className="w-full rounded-lg border border-border"
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
