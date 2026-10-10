# AI Carousel Studio

Local tool that turns carousel content into polished 1080 × 1350 Instagram slides.

**You (or Claude Code) write the content as JSON → Zod validates it → HTML/CSS templates → Playwright PNGs → layout checks → preview & edit → caption + ZIP export.**

No AI API keys, no per-post cost. The words come from a chat with Claude Code. Everything else runs locally.

## Quick start: just make PNGs (no database)

```bash
npm install
npx playwright install chromium                      # one time
npm run render -- content/play-store-pop.json        # → output/play-store-pop/v1/
```

The folder gets `slide-01.png …`, `contact-sheet.png`, `caption.txt`, `content.json` and `carousel.zip`, overwritten on each run. Add `--slide 1` to render just one slide while you tweak.

Branding for the CLI comes from `content/brand.json`:

```json
{
  "name": "Your Name",
  "handle": "@yourhandle",
  "photo": "../data/me.jpg",
  "focalX": 50,
  "focalY": 35,
  "zoom": 1
}
```

`photo` is relative to `content/`; keep it in `data/` (git-ignored) so your face never gets committed. With a photo, the cover shows it next to an "Inside" list, and every slide's footer shows a small round photo of you next to your handle. Without one, you get the photo-free layout.

## Templates and slide types

| Template             | Look                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `bold-pop` (default) | Different bright color per slide, huge type, thick outlines, progress bar. Made for Instagram. |
| `ship-it-right`      | Calm light cards                                                                               |
| `night-shift`        | Dark                                                                                           |

Slide types: `statement` (a few huge words), `stat` (one big number), `steps` (flow), `dodont`, `mockup` (phone frame with your screenshot or a generated screen), `content`, `code` (syntax-highlighted, with highlighted lines), `comparison`, `checklist`, `closing`. Any title can mark words with `highlight` and show a Lucide `icon`. The full format is in `CLAUDE.md`, and `content/play-store-pop.json` shows every new type.

## Making content without Claude Code (website)

On the home page, type a topic and click **Copy prompt**, then **Open Claude** and paste the prompt (claude.ai's free tier works). Copy Claude's JSON reply back into the box (code fences are fine) and click **Render carousel**.

## Making a new carousel with Claude Code

Ask in chat, for example: _"Make a carousel: before posting an app on the Play Store, 5 things to remember."_
Claude Code follows `CLAUDE.md`. It writes `content/<slug>.json`, checks facts that change over time, renders the file, looks at the PNGs and fixes any overflowing slides.

You can also write or paste the JSON yourself. The format is in `CLAUDE.md`, and the examples are in `content/`.

## The app (editor, history, photo settings)

```bash
cp .env.example .env.local   # defaults are fine
npm run db:local             # terminal 1: local MongoDB, data in data/mongo
npm run dev                  # terminal 2: http://localhost:3000
```

1. **Settings**: upload your creator photo, set its focus point and zoom, and enter your name and handle. Your original file is never modified.
2. **New carousel**: click a draft from `content/`, paste JSON, or open a `.json` file. It's validated as you type, and you'll get a warning if the topic matches an earlier project.
3. **Render carousel**: progress shows the real stages: validating → rendering → checking layout → preparing exports.
4. **Edit** any text on the left, switch template, then **Save & rerender**. Slides with overflowing text are outlined in red with a message.
5. **Export**: Download ZIP, or download each file separately. Copy caption puts the caption text on the clipboard.
6. Projects reopen from the home page after restarts.

## Configuration (`.env.local`)

| Variable                     | Default                                         | Notes                                        |
| ---------------------------- | ----------------------------------------------- | -------------------------------------------- |
| `MONGODB_URI` / `MONGODB_DB` | `mongodb://127.0.0.1:27017` / `carousel_studio` | Project history and settings (app only).     |
| `OUTPUT_DIR`                 | `./output`                                      | Rendered exports.                            |
| `DATA_DIR`                   | `./data`                                        | Uploaded creator photos and `db:local` data. |
| `CONTENT_DIR`                | `./content`                                     | Drafts shown on the home page.               |

## Scripts

| Script                                                | Purpose                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run render -- <files…> [--template night-shift]` | Render content JSON to PNGs + ZIP (no DB)                                        |
| `npm run dev` / `build` / `start`                     | The app                                                                          |
| `npm run db:local`                                    | Local MongoDB (downloads `mongod` once)                                          |
| `npm run lint` / `typecheck` / `format`               | Code quality                                                                     |
| `npm test`                                            | Unit + integration tests, including a check that every `content/*.json` is valid |
| `npm run test:e2e`                                    | Build, then browser UI tests                                                     |

## How it works

```
content/                 carousel JSON drafts (+ brand.json for the CLI)
scripts/render.ts        CLI renderer
src/
  app/                   pages (/, /projects/[id], /settings) and API routes
  components/            ImportForm, CarouselEditor, ProjectStudio, GenerationProgress
  templates/             layout.ts (all 6 slide types as escaped HTML), themes.ts (design tokens)
  lib/
    schemas/             Zod schemas: the source of truth for content and limits
    render/              Playwright renderer, layout checks, contact sheet, inline fonts
    export/              caption.txt, content.json, carousel.zip
    pipeline/            stage streaming shared by import and rerender
    db/                  MongoDB projects + settings
    drafts/, photo/, files/, caption/, topics/   small single-purpose helpers
```

- **Validation:** slide count (3–12), types, a single closing slide at the end, text, bullet and code limits, no unknown keys. Fonts are never shrunk to fit.
- **Rendering:** each slide is a standalone HTML page with fonts and the photo inlined. The renderer blocks all network requests. After rendering, each PNG is checked for 1080 × 1350, and the page is checked for overflowing text, over-wide code lines and broken images.
- **Security:** text is always HTML-escaped. Request bodies are validated and size-limited. Downloads only serve known filenames from validated folders. Uploads are checked by decoding the image.

## Troubleshooting

| Problem                             | Fix                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------- |
| "Cannot reach MongoDB"              | Start `npm run db:local`, or check `MONGODB_URI`. The CLI doesn't need it. |
| "Chromium is not installed"         | `npx playwright install chromium`                                          |
| `! slide N: Text overflows`         | Shorten that slide's copy and render again.                                |
| Draft shown in red on the home page | Hover over it to see the validation error, or run `npm test`.              |

## Limitations

- Single user, local only, no auth. Don't expose it to the internet.
- No Instagram publishing or scheduling. You review and post manually.
- Three templates (Bold Pop, light, dark) share one layout engine. Icons come from Lucide; screenshots for mockups must live inside `content/`.
- Latin-script fonts only.
