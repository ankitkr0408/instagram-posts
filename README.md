# Carousel Studio

Local tool for **@ankit.aitalks** Instagram carousels. Claude Code writes the content, and this repo renders it into 1080 × 1350 PNGs with HTML/CSS templates. No web app, no database, no API keys.

## Setup (once)

```bash
npm install
npx playwright install chromium
```

Put your photo at `data/me.png` (git-ignored). Name, handle and photo crop are in `content/brand.json`.

## Daily use

In Claude Code:

```
/carousel 5 Git habits that save hours
```

Claude writes `content/<slug>.json`, renders the cover for you to check, then renders everything once you approve. To post, open `output/<slug>/`: `slide-01.png …`, `caption.txt` (caption + hashtags) and `carousel.zip`.

Rendering by hand:

```bash
npm run render -- content/play-store-pop.json            # all slides + caption + zip
npm run render -- content/play-store-pop.json --slide 1  # just one slide
npm run render -- content/x.json --template night-shift  # try another template
```

Templates: `bold-pop` (default), `ship-it-right` (light), `night-shift` (dark). The content format and design file map are in `CLAUDE.md`.

## Checks

```bash
npm run lint && npm run typecheck && npm test
```

## Cost

Rendering is free and local. Writing content uses your Claude plan: roughly 10-25k tokens per carousel, less if you skip fact-checking searches.
