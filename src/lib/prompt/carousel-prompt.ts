import { CATEGORIES, LIMITS } from "@/lib/schemas/carousel.schema";
import { TEMPLATE_NAMES } from "@/templates/themes";

/**
 * Prompt to paste into any Claude chat (claude.ai, free tier works). It returns a carousel
 * file the app can import. Keep in sync with the schema; tests check the example is valid.
 */
export const PROMPT_EXAMPLE = {
  topic: "Before publishing on the Play Store",
  category: "launch-checklists",
  template: "bold-pop",
  content: {
    seriesName: "Ship It Right",
    seriesPart: "Android",
    cover: { headline: "Don't hit Publish yet", highlight: "Publish", subtitle: "5 checks first." },
    slides: [
      {
        id: "hook",
        type: "statement",
        title: "Launch delays come from small misses.",
        highlight: "small misses.",
      },
      {
        id: "bundle",
        type: "content",
        icon: "package",
        title: "Ship a signed App Bundle",
        bullets: ["Build with ./gradlew bundleRelease", "Back up your upload keystore"],
      },
      {
        id: "target",
        type: "stat",
        title: "Required target",
        stat: { value: "API 36", label: "for new apps and updates (as of 2026)" },
      },
      {
        id: "rollout",
        type: "steps",
        title: "Release in stages",
        steps: [
          { label: "Internal test" },
          { label: "Closed test" },
          { label: "Staged rollout", detail: "Start small" },
        ],
      },
      {
        id: "listing",
        type: "dodont",
        title: "Make the listing sell",
        dont: ["Slogan-only screenshots"],
        do: ["Real screens + short caption"],
      },
      {
        id: "closing",
        type: "closing",
        icon: "rocket",
        title: "Make launch day boring.",
        highlight: "boring.",
      },
    ],
    caption: {
      caption: "Short caption, 2-3 paragraphs.",
      cta: "Save this for launch day.",
      hashtags: ["androiddev", "playstore"],
    },
  },
};

export function buildCarouselPrompt(topic: string, slideCount = 9): string {
  return `You write Instagram carousels for a page about AI, software development and product building.
Write a carousel about: "${topic.trim()}"

Reply with ONLY a JSON object (no prose) in exactly this shape:
${JSON.stringify(PROMPT_EXAMPLE, null, 1)}

Rules:
- ${slideCount} slides total = cover + ${slideCount - 1} entries in "slides". The last slide is the only "closing".
- template: one of ${TEMPLATE_NAMES.join(", ")} (use bold-pop). category: one of ${CATEGORIES.join(", ")}.
- Slide types: statement (few huge words), stat (one big REAL number), steps (2-5 {label, detail?}), dodont (do/dont lists, 1-3 each), mockup ({mockup: {screenTitle, rows: [...]}}), content (description?, bullets ≤3, tip?), code ({code: {language, after, before?, explanation?, highlightLines?}}), comparison ({comparison: {leftTitle, rightTitle, rows: [{left, right}]}}), checklist (2-6 bullets), closing.
- Optional on any slide: "highlight" (exact words from the title to mark) and "icon" (a lucide.dev icon name).
- Instagram style: max 30 words per slide, headline 4-8 words (≤ ${LIMITS.headline} chars), titles ≤ ${LIMITS.title} chars, bullets ≤ ${LIMITS.bullet} chars, code lines ≤ 50 chars and ≤ ${LIMITS.codeLines} lines. Mix visual slide types.
- Slide ids: short lowercase-dash, unique.
- Honest and practical: no fake statistics, invented stories or unsupported claims. Qualify facts that change ("as of 2026", "check the docs"). Use placeholders like YOUR_API_KEY, never real secrets.`;
}

/** Pull the JSON object out of a chat reply (strips ```json fences and surrounding prose). */
export function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}
