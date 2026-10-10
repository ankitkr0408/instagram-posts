"use client";

import { STAGES, type StageId } from "@/lib/pipeline/events";

export type ProgressState = { stages: StageId[]; current: StageId | null; failed: boolean };

export const idleProgress: ProgressState = { stages: [], current: null, failed: false };

/** Lists the real stages this run goes through. No percentages: we don't know them. */
export function GenerationProgress({
  state,
  include,
}: {
  state: ProgressState;
  include: StageId[];
}) {
  if (!state.current) return null;
  const reachedIndex = include.indexOf(state.current);
  return (
    <ol
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-sm"
      aria-live="polite"
    >
      {STAGES.filter((s) => include.includes(s.id)).map((stage, i) => {
        const status =
          i < reachedIndex
            ? "done"
            : i === reachedIndex
              ? state.failed
                ? "failed"
                : "active"
              : "pending";
        return (
          <li
            key={stage.id}
            className="flex items-center gap-3"
            data-stage={stage.id}
            data-status={status}
          >
            <span
              aria-hidden
              className={`size-2.5 rounded-full ${
                status === "done"
                  ? "bg-accent"
                  : status === "active"
                    ? "animate-pulse bg-warn"
                    : status === "failed"
                      ? "bg-danger"
                      : "bg-border"
              }`}
            />
            <span className={status === "pending" ? "text-muted" : ""}>
              {stage.label}
              {status === "active" && "…"}
              {status === "failed" && " failed"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function progressReducer(state: ProgressState, stage: StageId): ProgressState {
  return { stages: [...state.stages, stage], current: stage, failed: false };
}
