# CLAUDE.md: Carousel Studio (local only)

Instagram carousels for **@ankit.aitalks** (AI, software dev, product building).
Workflow: Claude writes `content/<slug>.json` → `npm run render` → PNGs in `output/<slug>/`. No web app, no database, no API keys. Everything runs locally.

**Don't read the source to make a carousel.** This file has everything needed. Only open code when the user asks to change the design or the tool. `project.md` is an outdated original brief; ignore it.

## Daily: make a carousel (`/carousel <topic>`)

1. If the topic has facts that change (policies, versions, prices), do one web search and qualify them ("as of Oct 2026").
2. Write `content/<short-slug>.json` (format below). Don't read other content files unless asked.
3. Preview the cover only: `npm run render -- content/<slug>.json --slide 1`, then look at `output/<slug>/slide-01.png`.
4. When the user is happy: `npm run render -- content/<slug>.json` (all slides + `contact-sheet.png`, `caption.txt`, `carousel.zip`). Look at the contact sheet once. Fix any `!` warnings by shortening text, and re-render.
5. Don't render extra versions or slides the user didn't ask for.

## File format

```json
{
  "topic": "short topic", "category": "launch-checklists", "template": "bold-pop",
  "content": {
    "seriesName": "Ship It Right", "seriesPart": "Android",
    "cover": { "headline": "Don't hit Publish yet", "highlight": "Publish", "subtitle": "5 checks first." },
    "slides": [ { "id": "hook", "type": "statement", "title": "…", "highlight": "…" }, …, { "id": "closing", "type": "closing", "title": "…" } ],
    "caption": { "caption": "…", "cta": "Save this…", "hashtags": ["androiddev"] }
  }
}
```

- `template`: `bold-pop` (default), `ship-it-right` (light), `night-shift` (dark). `category`: ai-for-developers, software-engineering, product-building, app-ideas, startup-breakdowns, developer-workflows, launch-checklists.
- 3-12 slides total (cover + `slides`). Exactly one `closing`, last. Slide ids: unique kebab-case.
- File-level `"color": "#A8D8FF"` = one background color for every slide (series use this). `cover.cta` = footer text on the cover (default "Swipe for all N").
- Any slide: optional `quote` (shown big with a bar, no quote marks needed), `highlight` (exact words from its title) and `icon` (lucide.dev name, e.g. `rocket`, `shield-check`, `package`), `description`, `tip`.

| type         | extra fields                                                                                            | use for                                          |
| ------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `statement`  | none (title = a few huge words)                                                                         | hook on slide 2                                  |
| `stat`       | `stat: {value ≤14 chars, label}`                                                                        | one big REAL number                              |
| `steps`      | `steps: [{label, detail?}]` 2-5                                                                         | flows/processes                                  |
| `dodont`     | `dont: [..]`, `do: [..]` 1-3 each                                                                       | mistakes vs best practice                        |
| `mockup`     | `mockup: {screenTitle?, rows?: [..], image?: "assets/x.png"}`                                           | app screens (image path relative to content/)    |
| `content`    | `bullets?: [..]` (≤3)                                                                                   | a point with a few bullets                       |
| `code`       | `code: {language, after, before?, explanation?, highlightLines?: [3]}`                                  | code tips (lines ≤ 50 chars, ≤ 14 lines)         |
| `comparison` | `comparison: {leftTitle, rightTitle, rows: [{left, right}]}`                                            | X vs Y                                           |
| `checklist`  | `bullets: [..]` 2-8                                                                                     | recap / save-worthy summary                      |
| `closing`    | `checkboxes?: 5` (empty boxes + "__/5") or `choices?: [..]` (2-4 big options) for an interactive finale | takeaway or finale; CTA comes from `caption.cta` |

Content, code, comparison, steps, dodont and mockup slides are auto-numbered 01, 02…; "5 things" = 5 of those. The cover shows "Swipe for all N".

**Style:** ≤ 30 words per slide, headline 4-8 words, mix visual types (not all bullets). Honest and practical: no fake stats, invented stories or unsupported claims. Use placeholders like `YOUR_API_KEY`, never real-looking secrets.

**Branding:** `content/brand.json` sets name, `@ankit.aitalks` and the photo (`data/me.png`, git-ignored), shown as a small round badge in every footer.

## Changing the design (only when asked)

| What                                                    | Where                                           |
| ------------------------------------------------------- | ----------------------------------------------- |
| Colors, template list                                   | `src/templates/themes.ts`                       |
| Slide HTML + CSS (classic `baseCss`, Bold Pop `popCss`) | `src/templates/layout.ts`                       |
| Fonts (Space Grotesk, Inter, JetBrains Mono)            | `src/lib/render/fonts.ts`                       |
| Content rules and limits                                | `src/lib/schemas/carousel.schema.ts` (`LIMITS`) |
| Icons, code highlighting, mockup images                 | `src/lib/render/slide-assets.ts`                |
| Screenshot + layout checks (Playwright)                 | `src/lib/render/render-carousel.ts`             |
| CLI flags and branding                                  | `scripts/render.ts`                             |

Rules: text goes through the `html` tag in `src/lib/render/html.ts` (auto-escapes); use `raw()` only for trusted markup. After design changes, render one slide and look at it.

## Checks

`npm run lint && npm run typecheck && npm test` (tests render with real Chromium and check every `content/*.json`).
