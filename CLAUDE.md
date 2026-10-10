# CLAUDE.md

Read `README.md` (how it works) and `AGENTS.md` (Next.js 16 notes) before coding. `project.md` is the original brief; its Gemini parts were dropped: **Claude Code writes the content**.

## When the user asks for a carousel

1. Write `content/<short-slug>.json` in this shape (only `content` is required):
   ```json
   {
     "topic": "…", "category": "launch-checklists", "template": "ship-it-right", "includePhoto": true,
     "content": {
       "seriesName": "Ship It Right", "seriesPart": "Android",
       "cover": { "headline": "…", "subtitle": "…" },
       "slides": [ { "id": "kebab-id", "type": "content", "title": "…", "description": "…", "bullets": ["…"], "tip": "…" }, … ],
       "caption": { "caption": "…", "cta": "…", "hashtags": ["androiddev"] }
     }
   }
   ```
   - **Default template: `bold-pop`** (color per slide, huge type). Also `ship-it-right` (light, calm) and `night-shift` (dark).
   - Slide types (all accept optional `highlight` = words from the title to mark, and `icon` = a Lucide name like `rocket`, `shield-check`, `package`):
     - `statement`: just a punchy `title` (≤ 8 words) + optional short `description`. Great as slide 2 hook.
     - `stat`: `stat: {value, label}`, one big real number (`"14 days"`, `"API 36"`). Never invent stats.
     - `steps`: `steps: [{label, detail?}]` (2-5), drawn as a flow.
     - `dodont`: `dont: [...]`, `do: [...]` (1-3 each).
     - `mockup`: phone frame. `mockup: {image?: "assets/x.png" (relative to content/), screenTitle?, rows?: [...]}`.
     - `content` (description/bullets/tip), `code` (`code: {language, before?, after?, explanation?, highlightLines?}`), `comparison`, `checklist` (2-6 bullets), `closing` (exactly one, last).
   - Point slides (content, code, comparison, steps, dodont, mockup) are auto-numbered 01, 02…; "5 things" = 5 of those. The no-photo cover lists them as "Inside".
   - **Instagram style**: ≤ 30 words per slide (the renderer warns in Bold Pop), headline 4-8 words, max 3 bullets, prefer a visual type (steps/dodont/mockup/stat/code) over bullet lists. Mix types so swiping feels varied.
   - Hard limits live in `LIMITS` in `src/lib/schemas/carousel.schema.ts`. Code lines ≤ 50 chars.
   - Example: `content/play-store-pop.json`.
2. Run `npm run render -- content/<slug>.json` (overwrites `output/<slug>/`). Use `--slide N` to preview a single slide while iterating. Fix any `!` warnings by shortening copy, and re-run.
3. Look at `output/<slug>/contact-sheet.png` (and single slides if needed) before saying it's done. Don't render extra versions the user didn't ask for.
4. `npm test` checks every file in `content/` against the schema.

Editorial rules: honest hook, one idea per slide, practical, no fake stats, invented experiences or unsupported claims. Verify facts that change (platform policies, API levels, prices) with a web search and qualify them ("as of …", "check …"). Use placeholders like `YOUR_API_KEY`, never real-looking secrets.

## Conventions

- **MongoDB** (owner's choice; `npm run db:local` runs one without a system install), **npm** (don't switch).
- Zod schemas in `src/lib/schemas/` are the source of truth.
- Templates are TS functions returning escaped HTML (`src/lib/render/html.ts`). Interpolate text only via the `html` tag; `raw()` only for trusted markup.
- Server-only modules start with `import "server-only"` (stubbed in Vitest; scripts run with `--conditions=react-server`).
- Paths derived from user input go through `src/lib/files/paths.ts`.
- The CLI overwrites `output/<slug>/`; the app keeps `v<n>` render history per project.
- The Claude chat prompt lives in `src/lib/prompt/carousel-prompt.ts`; keep it in sync with the schema (a test validates its example).
- After template changes, render `content/*.json` and look at the PNGs.

## Checks

`npm run lint && npm run typecheck && npm test && npm run build && npx playwright test`
