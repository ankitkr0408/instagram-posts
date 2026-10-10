import { Suspense } from "react";
import { ProjectStudioRoute } from "@/components/ProjectStudio";

export default function ProjectPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <Suspense fallback={<p className="text-sm text-muted">Loading project…</p>}>
        <ProjectStudioRoute />
      </Suspense>
    </main>
  );
}
