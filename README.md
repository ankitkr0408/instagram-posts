# AI Carousel Studio

Local tool that turns a topic into a 1080 × 1350 Instagram carousel.

**Topic → Gemini structured content → Zod validation → HTML/CSS templates → Playwright PNGs → layout checks → preview & edit → caption + ZIP export.**

AI writes the words; code does the design. No image-generation models are used, so text is always crisp and editable.

## Quick start

```bash
npm install
npx playwright install chromium        # renderer (one time)
cp .env.example .env.local             # then fill in the values below
npm run db:local                       # terminal 1: local MongoDB (skip if you already run MongoDB)
npm run dev                            # terminal 2: http://localhost:3000
```

Minimum `.env.local`:

```bash
GEMINI_API_KEY=your-key                # https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-3.5-flash-lite     # check https://ai.google.dev/gemini-api/docs/models for current IDs
```

No key yet? Set `GEMINI_MOCK=1` to use built-in sample content. Everything else works, and it costs nothing.

## Using it

1. **Settings**: upload your creator photo, set the focus point/zoom, name and handle. The original file is never modified, and every upload is kept.
2. **New carousel**: enter a topic, category, template, slide count (default 9), tone and optional audience. You'll get a warning if the topic matches an earlier one; press Generate again to reuse it anyway.
3. Progress shows the real stages: preparing prompt → generating → validating → rendering → checking layout → preparing exports.
4. **Edit** any text on the left. **Save & rerender** applies the edits with **no AI call**. **Regenerate slide** rewrites one slide. **Regenerate all** rewrites everything. If a regeneration fails, your edits are kept.
5. **Export**: Download ZIP (all PNGs, contact sheet, `caption.txt`, `content.json`), or download each file separately. Copy caption puts the caption text on the clipboard.
6. Projects appear on the home page and reopen after restarts.

Every render goes to a new folder: `output/<project-id>/v<n>/`. Earlier renders are never deleted.

## Configuration (`.env.local`)

| Variable                                                       | Default                                         | Notes                                                                                                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`                                               | —                                               | Server-side only. Never prefix with `NEXT_PUBLIC_`.                                                                                                   |
| `GEMINI_MODEL`                                                 | —                                               | Required unless mock mode is on.                                                                                                                      |
| `GEMINI_MOCK`                                                  | off                                             | `1` = sample content, no API calls.                                                                                                                   |
| `MONGODB_URI` / `MONGODB_DB`                                   | `mongodb://127.0.0.1:27017` / `carousel_studio` | Project history and settings.                                                                                                                         |
| `OUTPUT_DIR`                                                   | `./output`                                      | Rendered exports.                                                                                                                                     |
| `DATA_DIR`                                                     | `./data`                                        | Creator photos, failed-generation diagnostics, `db:local` data.                                                                                       |
| `MAX_SLIDES`                                                   | `12`                                            | Upper limit including the cover.                                                                                                                      |
| `MAX_GENERATION_RETRIES`                                       | `1`                                             | Repair attempts after an invalid AI response.                                                                                                         |
| `GENERATION_TIMEOUT_MS`                                        | `60000`                                         | Per Gemini request.                                                                                                                                   |
| `GEMINI_INPUT_PRICE_PER_MTOK` / `GEMINI_OUTPUT_PRICE_PER_MTOK` | blank                                           | USD per 1M tokens from the [pricing page](https://ai.google.dev/gemini-api/docs/pricing). If blank, the cost shows as unavailable instead of a guess. |

**Cost:** one carousel takes one Gemini call, plus at most one repair call. Rendering, layout checks, the contact sheet and the ZIP all run locally for free. On the free tier, Google uses your prompts to improve its products; on the paid tier it does not (per the pricing page, Oct 2026). Check the current terms.

## Scripts

| Script                                                                   | Purpose                                                                       |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`                                        | Next.js dev, production build, production server                              |
| `npm run db:local`                                                       | Local MongoDB with on-disk data in `data/mongo` (downloads `mongod` once)     |
| `npm run sample -- [outDir] [--photo file.jpg] [--template night-shift]` | Render the built-in sample carousel (no AI, no DB)                            |
| `npm run lint` / `typecheck` / `format`                                  | Code quality                                                                  |
| `npm test`                                                               | Unit + integration tests (real Chromium and in-memory MongoDB; Gemini mocked) |
| `npm run test:e2e`                                                       | Builds, then runs browser UI tests against the app in mock mode               |

No test calls a paid API.

## How it works

```
src/
  app/                      pages (/, /projects/[id], /settings) and API routes
  components/               TopicForm, CarouselEditor, ProjectStudio, GenerationProgress
  templates/                layout.ts (all 6 slide types as escaped HTML), themes.ts (design tokens)
  lib/
    ai/                     prompt builder, Gemini client, generate/validate/repair, mock mode
    schemas/                Zod schemas: the source of truth for content limits
    render/                 Playwright renderer, layout checks, contact sheet, inline fonts
    export/                 caption.txt, content.json, carousel.zip
    pipeline/               stage streaming (NDJSON) shared by generate and rerender
    db/                     MongoDB projects + settings
    photo/, files/, cost/, caption/, topics/   small single-purpose helpers
```

- **Validation:** the Gemini response is cleaned deterministically (empty or irrelevant fields dropped), validated with Zod (slide count, types, closing slide, text, bullet and code limits, no unknown keys), repaired at most once, then rejected with a saved diagnostic in `data/diagnostics/`.
- **Rendering:** each slide is a standalone HTML page. Fonts and the photo are inlined, and the renderer blocks all network requests. After rendering, the app checks that each PNG is 1080 × 1350 and the DOM is checked for overflowing text, over-wide code lines and broken images. Problems are shown under the affected slide. Fonts are never shrunk to fit.
- **Security:** user text is always HTML-escaped. Request bodies are validated and size-limited. File downloads only serve known filenames inside validated project folders. Uploads are checked by decoding the image, not by trusting its extension. API keys never reach the browser or the database.

## Troubleshooting

| Problem                                              | Fix                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| "Cannot reach MongoDB"                               | Start `npm run db:local`, or check `MONGODB_URI`.                            |
| "Chromium is not installed"                          | `npx playwright install chromium`                                            |
| "GEMINI_MODEL is not set" / "model is not available" | Set a current model ID from the models page.                                 |
| "rate limit or quota reached"                        | Wait a minute; check your quota in AI Studio.                                |
| "did not pass validation"                            | Try again or simplify the topic. The raw response is in `data/diagnostics/`. |
| Red warning under a slide                            | Shorten that slide's text and use Save & rerender.                           |
| System status                                        | Expand it on the home page, or `GET /api/health`.                            |

## Limitations

- Single user, local only. No auth; don't expose it to the internet.
- No Instagram publishing, scheduling or topic queue. You review and post manually.
- Two templates (light/dark) that share one layout. Code is shown in monospace without syntax highlighting.
- Latin-script fonts only; other scripts fall back to system fonts.
