"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type DraftView, type ProjectSummaryView } from "@/lib/client/api";
import { CATEGORY_LABELS } from "@/lib/schemas/carousel.schema";
import { ImportForm } from "./ImportForm";

export function HomeClient() {
  const [projects, setProjects] = useState<ProjectSummaryView[]>([]);
  const [drafts, setDrafts] = useState<DraftView[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listProjects().then(
      (r) => setProjects(r.projects),
      (e: Error) => setError(e.message),
    );
    api.listDrafts().then(
      (r) => setDrafts(r.drafts),
      () => setDrafts([]),
    );
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold">New carousel</h2>
        <p className="mb-4 text-sm text-muted">
          Ask Claude Code to write a carousel into <code>content/</code>, then pick it below. Or
          paste the JSON.
        </p>
        <ImportForm projects={projects} drafts={drafts} />
      </section>
      <section aria-labelledby="history" className="flex flex-col gap-3">
        <h2 id="history" className="text-lg font-semibold">
          Projects
        </h2>
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && projects.length === 0 && <p className="text-sm text-muted">No projects yet.</p>}
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li key={p._id}>
              <Link
                href={`/projects/${p._id}`}
                className="block rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:border-accent"
              >
                <span className="block font-medium">{p.topic}</span>
                <span className="text-xs text-muted">
                  {CATEGORY_LABELS[p.category]} · {new Date(p.createdAt).toLocaleDateString()} ·{" "}
                  {p.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
