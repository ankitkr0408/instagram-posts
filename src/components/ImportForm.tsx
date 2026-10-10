"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type DraftView, type ProjectSummaryView } from "@/lib/client/api";
import { parseCarouselFile } from "@/lib/schemas/carousel.schema";
import { buildCarouselPrompt, extractJson } from "@/lib/prompt/carousel-prompt";
import { findDuplicateTopics } from "@/lib/topics/duplicate-topic";
import {
  GenerationProgress,
  idleProgress,
  progressReducer,
  type ProgressState,
} from "./GenerationProgress";

type Check = { ok: true; topic: string; slides: number } | { ok: false; message: string } | null;

function check(text: string): Check {
  if (!text.trim()) return null;
  let data: unknown;
  try {
    data = JSON.parse(extractJson(text));
  } catch {
    return { ok: false, message: "Not valid JSON yet." };
  }
  const result = parseCarouselFile(data);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, message: `${first.path.join(".") || "root"}: ${first.message}` };
  }
  return {
    ok: true,
    topic: result.data.topic ?? result.data.content.cover.headline,
    slides: result.data.content.slides.length + 1,
  };
}

export function ImportForm({
  projects,
  drafts,
}: {
  projects: ProjectSummaryView[];
  drafts: DraftView[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>(idleProgress);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(buildCarouselPrompt(topic));
      setCopied(true);
    } catch {
      setError("Could not access the clipboard.");
    }
  }

  const status = check(text);
  const duplicates = status?.ok
    ? findDuplicateTopics(
        status.topic,
        projects.map((p) => p.topic),
      )
    : [];
  const needsConfirm = duplicates.length > 0 && confirmed !== text;

  async function loadDraft(name: string) {
    setError(null);
    try {
      setText(await api.readDraft(name));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!status?.ok) return;
    if (needsConfirm) return setConfirmed(text);
    setBusy(true);
    setError(null);
    setProgress(idleProgress);
    try {
      const last = await api.importCarousel(extractJson(text), (e) => {
        if (e.type === "stage") setProgress((p) => progressReducer(p, e.stage));
        if (e.type === "error") setProgress((p) => ({ ...p, failed: true }));
      });
      if (last?.type === "done") return router.push(`/projects/${last.projectId}`);
      setError(last?.type === "error" ? last.message : "Rendering stopped unexpectedly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">1. Get content from Claude (free)</legend>
        <div className="flex flex-wrap gap-2">
          <input
            aria-label="Topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setCopied(false);
            }}
            placeholder="Topic, e.g. 5 Git habits that save hours"
            maxLength={160}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={topic.trim().length < 3}
            onClick={copyPrompt}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
          >
            {copied ? "Copied ✓" : "Copy prompt"}
          </button>
          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-accent"
          >
            Open Claude ↗
          </a>
        </div>
        <p className="text-xs text-muted">
          Paste the prompt into Claude, then paste its JSON reply below. Or ask Claude Code to write
          a file into content/.
        </p>
      </fieldset>

      {drafts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Drafts in content/</p>
          <ul className="flex flex-wrap gap-2">
            {drafts.map((d) => (
              <li key={d.name}>
                <button
                  type="button"
                  onClick={() => loadDraft(d.name)}
                  title={d.error ?? d.topic ?? d.name}
                  className={`rounded-lg border px-3 py-1.5 text-left text-xs hover:border-accent ${
                    d.error ? "border-danger/50 text-danger" : "border-border"
                  }`}
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        2. Carousel JSON
        <textarea
          name="content"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          rows={14}
          spellCheck={false}
          placeholder='Paste a carousel file, e.g. {"topic": "...", "template": "ship-it-right", "content": {...}}'
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs focus:outline-2 focus:outline-accent"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        Or open a .json file:
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) setText(await file.text());
          }}
        />
      </label>

      {status && (
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            status.ok ? "border-accent/40 bg-accent/10" : "border-warn/40 bg-warn/10"
          }`}
        >
          {status.ok ? `Valid: “${status.topic}”, ${status.slides} slides.` : status.message}
          {status.ok && duplicates.length > 0 && (
            <span className="block">
              {duplicates[0].kind === "exact"
                ? "You already made a carousel on this topic"
                : "Similar to an earlier topic"}
              : “{duplicates[0].topic}”.{" "}
              {needsConfirm ? "Press Render again to make it anyway." : "Rendering anyway."}
            </span>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !status?.ok}
        className="self-start rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Rendering…" : "Render carousel"}
      </button>

      <GenerationProgress state={progress} include={["validate", "render", "check", "export"]} />
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </form>
  );
}
