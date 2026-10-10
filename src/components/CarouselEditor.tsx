"use client";

import { useState } from "react";
import { LIMITS, type CarouselContent, type Slide } from "@/lib/schemas/carousel.schema";

const input =
  "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm focus:outline-2 focus:outline-accent";

function Text(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  max: number;
  multiline?: boolean;
  mono?: boolean;
}) {
  const length = props.value?.length ?? 0;
  const Tag = props.multiline ? "textarea" : "input";
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      <span className="flex justify-between">
        {props.label}
        <span className={length > props.max ? "text-danger" : ""}>
          {length}/{props.max}
        </span>
      </span>
      <Tag
        className={`${input} text-foreground ${props.mono ? "font-mono" : ""}`}
        value={props.value ?? ""}
        rows={props.multiline ? 3 : undefined}
        onChange={(e) => props.onChange(e.target.value === "" ? undefined : e.target.value)}
      />
    </label>
  );
}

const toItems = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** One item per line. Keeps the raw text locally so blank lines can be typed. */
function Lines(props: {
  label: string;
  value: string[] | undefined;
  onChange: (value: string[] | undefined) => void;
  hint?: string;
}) {
  const external = (props.value ?? []).join("\n");
  const [text, setText] = useState(external);
  const [synced, setSynced] = useState(external);
  // Resync when the value changes from outside (e.g. project reloaded), not while typing.
  if (external !== synced) {
    setSynced(external);
    if (toItems(text).join("\n") !== external) setText(external);
  }
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {props.label} {props.hint && <span className="font-normal">({props.hint})</span>}
      <textarea
        className={`${input} text-foreground`}
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const items = toItems(e.target.value);
          setSynced(items.join("\n"));
          props.onChange(items.length ? items : undefined);
        }}
      />
    </label>
  );
}

function SlideFields({ slide, onChange }: { slide: Slide; onChange: (slide: Slide) => void }) {
  const set = (patch: Partial<Slide>) => onChange({ ...slide, ...patch } as Slide);
  return (
    <>
      <Text
        label="Title"
        value={slide.title}
        max={LIMITS.title}
        onChange={(v) => set({ title: v ?? "" })}
      />
      <Text
        label="Description"
        value={slide.description}
        max={LIMITS.description}
        multiline
        onChange={(v) => set({ description: v })}
      />
      {(slide.type === "content" || slide.type === "checklist" || slide.type === "closing") && (
        <Lines
          label="Bullets"
          hint="one per line"
          value={slide.bullets}
          onChange={(v) =>
            set({ bullets: slide.type === "checklist" ? (v ?? []) : v } as Partial<Slide>)
          }
        />
      )}
      {slide.type === "code" && (
        <>
          <Text
            label="Language"
            value={slide.code.language}
            max={20}
            onChange={(v) => onChange({ ...slide, code: { ...slide.code, language: v ?? "" } })}
          />
          <Text
            label="Before"
            mono
            multiline
            value={slide.code.before}
            max={LIMITS.codeChars}
            onChange={(v) => onChange({ ...slide, code: { ...slide.code, before: v } })}
          />
          <Text
            label="After"
            mono
            multiline
            value={slide.code.after}
            max={LIMITS.codeChars}
            onChange={(v) => onChange({ ...slide, code: { ...slide.code, after: v } })}
          />
          <Text
            label="Explanation"
            multiline
            value={slide.code.explanation}
            max={LIMITS.description}
            onChange={(v) => onChange({ ...slide, code: { ...slide.code, explanation: v } })}
          />
        </>
      )}
      {slide.type === "comparison" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Text
              label="Left heading"
              value={slide.comparison.leftTitle}
              max={30}
              onChange={(v) =>
                onChange({ ...slide, comparison: { ...slide.comparison, leftTitle: v ?? "" } })
              }
            />
            <Text
              label="Right heading"
              value={slide.comparison.rightTitle}
              max={30}
              onChange={(v) =>
                onChange({ ...slide, comparison: { ...slide.comparison, rightTitle: v ?? "" } })
              }
            />
          </div>
          <Lines
            label="Rows"
            hint="left | right, one per line"
            value={slide.comparison.rows.map((r) => `${r.left} | ${r.right}`)}
            onChange={(lines) =>
              onChange({
                ...slide,
                comparison: {
                  ...slide.comparison,
                  rows: (lines ?? []).map((line) => {
                    const [left = "", ...rest] = line.split("|");
                    return { left: left.trim(), right: rest.join("|").trim() };
                  }),
                },
              })
            }
          />
        </>
      )}
      {slide.type !== "closing" && (
        <Text
          label="Tip"
          value={slide.tip}
          max={LIMITS.tip}
          multiline
          onChange={(v) => set({ tip: v })}
        />
      )}
    </>
  );
}

export function CarouselEditor(props: {
  content: CarouselContent;
  onChange: (content: CarouselContent) => void;
}) {
  const { content, onChange } = props;
  const card = "flex flex-col gap-3 rounded-xl border border-border bg-surface p-4";

  return (
    <div className="flex flex-col gap-4">
      <section className={card} aria-label="Cover">
        <h3 className="text-sm font-semibold">1 · Cover</h3>
        <div className="grid grid-cols-2 gap-2">
          <Text
            label="Series"
            value={content.seriesName}
            max={LIMITS.seriesName}
            onChange={(v) => onChange({ ...content, seriesName: v ?? "" })}
          />
          <Text
            label="Part"
            value={content.seriesPart}
            max={LIMITS.seriesPart}
            onChange={(v) => onChange({ ...content, seriesPart: v })}
          />
        </div>
        <Text
          label="Headline"
          value={content.cover.headline}
          max={LIMITS.headline}
          multiline
          onChange={(v) => onChange({ ...content, cover: { ...content.cover, headline: v ?? "" } })}
        />
        <Text
          label="Subtitle"
          value={content.cover.subtitle}
          max={LIMITS.subtitle}
          multiline
          onChange={(v) => onChange({ ...content, cover: { ...content.cover, subtitle: v ?? "" } })}
        />
        <label className="flex items-center gap-2 text-xs font-medium text-muted">
          Photo side
          <select
            className={`${input} w-auto text-foreground`}
            value={content.cover.photoPosition ?? "right"}
            onChange={(e) =>
              onChange({
                ...content,
                cover: { ...content.cover, photoPosition: e.target.value as "left" | "right" },
              })
            }
          >
            <option value="right">right</option>
            <option value="left">left</option>
          </select>
        </label>
      </section>

      {content.slides.map((slide, i) => (
        <section key={slide.id} className={card} aria-label={`Slide ${i + 2}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {i + 2} · {slide.type}
            </h3>
          </div>
          <SlideFields
            slide={slide}
            onChange={(next) =>
              onChange({ ...content, slides: content.slides.map((s, j) => (j === i ? next : s)) })
            }
          />
        </section>
      ))}

      <section className={card} aria-label="Caption">
        <h3 className="text-sm font-semibold">Caption</h3>
        <Text
          label="Caption"
          value={content.caption.caption}
          max={LIMITS.caption}
          multiline
          onChange={(v) =>
            onChange({ ...content, caption: { ...content.caption, caption: v ?? "" } })
          }
        />
        <Text
          label="Call to action (also shown on the last slide)"
          value={content.caption.cta}
          max={LIMITS.cta}
          onChange={(v) => onChange({ ...content, caption: { ...content.caption, cta: v ?? "" } })}
        />
        <Lines
          label="Hashtags"
          hint="one per line"
          value={content.caption.hashtags}
          onChange={(v) =>
            onChange({ ...content, caption: { ...content.caption, hashtags: v ?? [] } })
          }
        />
      </section>
    </div>
  );
}
