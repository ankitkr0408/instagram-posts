# CLAUDE.md

Read `project.md` (the product brief), `README.md` (how it works) and `AGENTS.md` (Next.js 16 notes) before coding.

## Deviations from the brief

- **MongoDB instead of SQLite** (owner's choice). `npm run db:local` runs one without a system install.
- **npm**, not pnpm. Do not switch.
- Templates are plain TS functions returning escaped HTML (`src/lib/render/html.ts`), not React components, to avoid `react-dom/server` in route handlers. Two themes share `src/templates/layout.ts`.
- Each render writes a new `output/<id>/v<n>/` folder; old renders are never deleted.

## Conventions

- Zod schemas in `src/lib/schemas/` are the source of truth; infer types from them.
- Server-only modules start with `import "server-only"` (aliased to a stub in Vitest; `npm run sample` uses `--conditions=react-server`).
- Never hardcode model IDs or prices; they come from env.
- Paths derived from user input go through `src/lib/files/paths.ts`.
- Interpolate slide text only via the `html` tag (auto-escapes). Use `raw()` only for trusted markup.
- Tests never call paid APIs: inject a `call` function, or set `GEMINI_MOCK=1` (topic containing `mock-fail` simulates a rate-limit error).
- After template changes, run `npm run sample` and look at the PNGs.

## Checks

`npm run lint && npm run typecheck && npm test && npm run build && npx playwright test`
