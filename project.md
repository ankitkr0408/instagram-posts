AI Instagram Carousel Studio
Claude Code Project Brief: Zero to Production-Ready Product
This is the primary implementation brief for Claude Code. Read it before
coding. Build in phases, test each phase, and keep the app runnable
throughout.
techstack -> nextjs ; mongodb ; typescript
1. Product goal
Build a local-first application that turns a topic into a polished
Instagram carousel. The user enters a topic; the app generates
structured slide content with Gemini, renders it using fixed HTML/CSS
templates, and exports PNG slides, a contact-sheet preview, a caption,
and a ZIP.
Core principle: use AI for content, code for design. Do not use
image-generation models to render text-heavy slides. HTML/CSS +
Playwright is more consistent, editable, and inexpensive.
Initial audience: one developer/creator running an Instagram page about
AI, software development, product building, app ideas, and developer
workflows. Build for a MacBook/local workflow first. Do not
over-engineer a multi-user SaaS.
2. Definition of done
- Topic and category input.
- Selectable template and slide count.
- Saved creator photo with configurable crop and a photo-free
  fallback.
- Gemini generates structured content.
- Zod validates the response before rendering.
- User can edit text and rerender without another AI call.
- Render 1080 × 1350 PNG slides.
- Support cover, content, code/example, comparison, checklist, and
  closing slide types.
- Detect text overflow, missing images, and invalid dimensions.
- Create a contact sheet.
- Generate caption, CTA, and relevant hashtags.
- Export individual PNGs, a content JSON, caption TXT, and ZIP.
- Save and reopen prior projects locally.
- Keep API keys server-side and out of Git.
- Tests, lint, typecheck, production build, and a complete README.
3. Recommended stack
- Next.js + React + TypeScript.
- Tailwind CSS for the application UI.
- Google Gemini API via the current official JavaScript/TypeScript
  SDK.
- A low-cost Flash-Lite-class model suitable for structured content;
  configure the model name through environment variables.
- Zod for runtime schemas.
- HTML/CSS templates rendered using Playwright/Chromium.
- Sharp for image checks, processing, and contact sheets.
- SQLite for local project history.
- Vitest (or a compatible test runner) and Playwright tests.
- pnpm if already installed; otherwise npm. Do not switch package
  managers midway.
Verify current official Google documentation before implementation
for SDK usage, model IDs, structured output, rate limits, data terms,
and pricing. Never rely on a model ID or price from an old tutorial.
4. Cost strategy
The Gemini text-generation API may be the only recurring cost in the
MVP. Check current free-tier availability, quotas, paid rates, and data
terms.
Use local code for: - HTML/CSS rendering. - Adding the creator photo. -
SVG icons and simple diagrams. - PNG export and contact sheets. - ZIP
creation. - SQLite history. - Layout checks.
Avoid image-generation APIs for every slide. Generate all slide content
in one structured response where practical. Keep prompts compact, avoid
sending conversation history, and use deterministic code for checks that
do not need AI.
Track model name, token usage if available, and estimated cost. Keep
model pricing in configuration rather than scattering prices in code.
Label estimates as estimates; do not invent a cost when usage/pricing
data is unavailable. Limit slide count, prompt length, retries, output
length, and request timeouts. Never retry indefinitely.
5. Content strategy
Content pillars
1. AI for developers.
2. Software engineering and app development.
3. Product building and shipping.
4. App ideas and MVPs.
5. Startup/product breakdowns.
6. Developer workflows and tools.
7. Security, accessibility, performance, and launch checklists.
Editorial rules
- Clear, direct, practical, conversational.
- Strong hooks without dishonest clickbait.
- No fake statistics, invented case studies, fake personal experience,
  or unsupported revenue claims.
- Avoid generic motivational posts and repetitive "top AI tools"
  lists.
- Technical examples must be accurate and safe; never include real
  secrets.
- Qualify claims that depend on changing docs or regional legal
  requirements.
- One main idea per slide, short copy, readable bullets, and practical
  examples.
- Do not force every topic into the same number of points.
- Detect exact and near-duplicate topics, but let the user
  intentionally reuse a topic.
Default 9-slide narrative
1. Cover hook and promise.
2. Context/problem. 3--7. Main points, examples, or practical steps.
3. Checklist/summary/example.
4. Closing takeaway and CTA.
Adapt the sequence when the topic needs it. Use concise text and do not
shrink fonts to fit excessive copy.
6. Design system
Canvas: 1080 × 1350 px, 4:5 portrait. Use safe margins and consistent
spacing.
Visual direction: - Warm off-white background. - Near-black text. -
Green primary accent. - Yellow, pink, and blue secondary highlights. -
Soft pastel information cards. - Consistent rounded corners, thin
dividers, restrained doodles, and simple SVG icons. - Bold cover
headlines and readable body typography. - Keep theme tokens
configurable.
Creator photo
Use the user's supplied local photo. Preserve the original file, allow
replacement, and support configurable crop/focal position. Never
recreate the creator's face with an image model. Warn if the photo is
missing and offer a photo-free cover. Do not put text over the face.
Required slide components
- CoverSlide: series label, headline, subtitle, photo/illustration,
  optional swipe cue.
- ContentSlide: number, heading, explanation, bullets, optional tip
  card.
- CodeSlide: concise code example rendered as real text, not an
  AI-generated picture.
- ComparisonSlide: clear before/after or two-column comparison.
- ChecklistSlide: readable actionable list.
- ClosingSlide: takeaway, CTA, consistent branding.
Use CSS Grid/Flexbox and a spacing scale. Do not position every element
with arbitrary absolute coordinates. Do not silently clip overflowing
text.
7. UX requirements
Main screen: - Topic input. - Category selector. - Template selector. -
Slide count selector (default 9). - Optional audience and tone. -
Creator photo selection. - Generate button. - Usage/cost estimate where
available.
Show real generation stages: 1. Preparing prompt. 2. Generating content.
3. Validating content. 4. Rendering slides. 5. Checking layout. 6.
Preparing exports.
After generation, let the user: - Preview each slide and the whole
carousel. - Edit headlines, descriptions, bullets, tips, and CTA. -
Regenerate the entire carousel or one slide. - Rerender edits without
calling Gemini. - Export PNGs, contact sheet, caption, JSON, and ZIP. -
Reopen saved projects.
Preserve user edits if regeneration fails. Do not show fake progress
percentages.
8. Suggested project structure
ai-carousel-studio/
├── README.md
├── CLAUDE.md
├── .env.example
├── .gitignore
├── package.json
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── settings/page.tsx
│   │   └── api/
│   │       ├── generate/route.ts
│   │       ├── render/route.ts
│   │       ├── projects/route.ts
│   │       └── export/route.ts
│   ├── components/
│   │   ├── TopicForm.tsx
│   │   ├── GenerationProgress.tsx
│   │   ├── SlidePreview.tsx
│   │   ├── ContactSheet.tsx
│   │   ├── CarouselEditor.tsx
│   │   └── ExportPanel.tsx
│   ├── templates/ship-it-right/
│   │   ├── CoverSlide.tsx
│   │   ├── ContentSlide.tsx
│   │   ├── CodeSlide.tsx
│   │   ├── ComparisonSlide.tsx
│   │   ├── ChecklistSlide.tsx
│   │   └── ClosingSlide.tsx
│   ├── lib/
│   │   ├── ai/gemini-client.ts
│   │   ├── ai/prompt-builder.ts
│   │   ├── ai/generate-carousel.ts
│   │   ├── schemas/carousel.schema.ts
│   │   ├── render/render-slide.ts
│   │   ├── render/render-carousel.ts
│   │   ├── render/create-contact-sheet.ts
│   │   ├── render/validate-layout.ts
│   │   ├── export/create-zip.ts
│   │   ├── db/database.ts
│   │   └── cost/estimate-cost.ts
│   └── styles/globals.css
├── public/creator/
├── data/
├── output/
└── tests/
Do not create empty files for every path at the start. Build modules
when needed and adapt to framework conventions.
9. Content schema
Use Zod as the runtime source of truth and infer TypeScript types where
practical. A conceptual structure:
type CarouselContent = {
  seriesName: string;
  seriesPart?: string;
  cover: {
    headline: string;
    subtitle: string;
    photoPosition?: "left" | "right" | "background";
  };
  slides: Array<{
    id: string;
    type: "content" | "code" | "comparison" | "checklist" | "closing";
    title: string;
    description?: string;
    bullets?: string[];
    code?: {
      language: string;
      before?: string;
      after?: string;
      explanation?: string;
    };
    comparison?: {
      leftTitle: string;
      rightTitle: string;
      rows: Array<{ left: string; right: string }>;
    };
    tip?: string;
    visualType?: "icon" | "diagram" | "ui_mockup" | "code" | "none";
  }>;
};

type CaptionContent = {
  caption: string;
  cta: string;
  hashtags: string[];
};
The real schema must enforce supported slide counts, required
cover/closing content, valid slide types, and text/bullet limits. Reject
unexpected data that could break rendering.
10. Gemini prompt and validation
Prompt the model to act as a technical content editor for an Instagram
page about AI, software, and product building.
Require: - Honest hook and logical narrative. - One main idea per
slide. - Concise copy and practical examples. - No repeated points, fake
stats, or unsupported claims. - Accurate technical examples and safe
placeholder credentials. - Structured output matching the schema. -
Relevant caption and CTA. - No markdown fences if strict JSON is
expected. - No invented personal experience. - No instructions to
generate a picture containing the slide text.
Flow: 1. Build a compact prompt from topic/category/audience/slide
count. 2. Request structured output using currently supported Gemini API
features. 3. Parse and validate with Zod. 4. If invalid, attempt at most
one controlled repair. 5. If still invalid, show an actionable error and
preserve a safe diagnostic. 6. Run deterministic text-length checks
before rendering.
Do not use an extra AI call for checks that ordinary code can perform.
11. Rendering and export
Rendering flow: 1. Validate content. 2. Map each slide to a template
component. 3. Render HTML at the fixed canvas size. 4. Use Playwright to
capture each slide at 1080 × 1350. 5. Wait for fonts and images to load.
6. Verify image dimensions and file integrity. 7. Check DOM bounds and
overflow. 8. Create contact sheet. 9. Create ZIP and save metadata.
Each project should export something like:
output/<project-id>/
├── slide-01.png
├── slide-02.png
├── ...
├── slide-09.png
├── contact-sheet.png
├── caption.txt
├── content.json
└── carousel.zip
Use collision-resistant IDs and sanitized filenames. Do not accept
arbitrary filesystem paths from user input. Validate uploaded image type
and size. Do not let the renderer fetch arbitrary user-supplied URLs.
Never delete previous exports automatically.
12. Persistence
Use SQLite for project metadata and history. Store: - Project ID, topic,
category, timestamp, status. - Template/version. - Validated content
JSON and caption. - Model name and token usage/cost estimate if
available. - Warnings and output paths.
Store images on disk, not as large database blobs. Handle missing output
files gracefully. Never store API keys in project records.
13. Security and configuration
- Keep GEMINI_API_KEY server-side only.
- Use .env.local and ignore it in Git.
- Commit .env.example, never real credentials.
- Validate all request bodies.
- Limit request sizes and generation limits.
- Do not log API keys or full environment variables.
- Escape user text and render it as text, not arbitrary HTML.
- Do not execute submitted code snippets.
- Do not expose secrets in client components or network responses.
Example .env.example:
GEMINI_API_KEY=
GEMINI_MODEL=
DATABASE_PATH=./data/carousel-studio.sqlite
OUTPUT_DIR=./output
CREATOR_PHOTO_PATH=./public/creator/creator-photo.jpg
MAX_SLIDES=12
MAX_GENERATION_RETRIES=1
14. Error handling
Handle: - Missing/invalid API key. - Unavailable model. - Rate
limit/quota errors. - Network failures and timeouts. - Invalid model
response/schema. - Rendering failure. - Missing photo/font/icon. - File
permissions and ZIP errors.
Show concise user-facing errors and useful local diagnostics. Never
retry indefinitely. Preserve drafts and edits on failure.
15. Tests
Unit tests: - Schema validation. - Text and slide-count limits. -
Filename sanitization. - Cost estimation. - Caption formatting. -
Duplicate-topic warning.
Integration tests: - Mock Gemini. - Validate good and malformed
responses. - Verify content reaches renderer. - Verify persistence and
export files. - Verify ZIP contents.
Rendering tests: - Every slide type renders. - Every PNG is 1080 ×
1350. - Contact sheet and ZIP are created. - Long headings do not
overflow. - Missing-photo fallback works. - Nine-slide project produces
all expected files.
UI tests: - Generate with a mocked API. - Edit and rerender without an
API call. - Regenerate a slide. - Download PNG and ZIP. - Reopen a
project. - Show errors on failure.
Automated tests must not require paid API calls.
16. Roadmap: zero to one
Phase 0: Inspect and plan
- Inspect repository and tools before changing files.
- Check Node and package manager versions.
- Verify current official Gemini SDK, model IDs, structured output,
  pricing, quotas, and terms.
- Record assumptions and plan.
- Do not overwrite existing work blindly.
Phase 1: App foundation
- Initialize/configure Next.js TypeScript.
- Enable strict mode, linting, and formatting.
- Build a clean application shell.
- Add .env.example and .gitignore.
- Confirm local startup.
Gate: app starts without errors.
Phase 2: Static design template
- Implement theme tokens and slide components.
- Use hardcoded sample content, no AI yet.
- Add creator photo and fallback.
- Render a sample 9-slide carousel.
- Export PNGs and contact sheet.
- Inspect the actual output and fix spacing/typography/overflow.
Gate: a polished, consistent carousel renders with correct
dimensions.
Phase 3: Schema and mocked generation
- Implement Zod schema and fixtures.
- Add mocked generation flow.
- Add slide editor and rerendering.
- Test long text and validation errors.
Gate: complete content-to-image workflow works without API cost.
Phase 4: Gemini integration
- Add official SDK.
- Implement prompt builder and server-side generation.
- Parse and validate structured output.
- Add bounded retries and useful errors.
- Record usage metadata and cost estimate.
- Test with a real API key; keep automated tests mocked.
Gate: a real topic produces valid slides.
Phase 5: Editor
- Edit slide content.
- Regenerate all or one slide.
- Preserve edits on failures.
- Rerender edits without API calls.
Gate: user can refine without paying for every text change.
Phase 6: Export
- PNGs, contact sheet, caption TXT, content JSON, ZIP.
- Validate filenames and contents.
- Add download controls.
Gate: one export action provides a complete package.
Phase 7: History
- SQLite persistence.
- Project list and reopen flow.
- Store metadata separately from image files.
Gate: projects persist across restarts.
Phase 8: Quality
- Add rendering regression tests.
- Improve loading/error states and accessibility.
- Test from a clean install.
- Run lint, typecheck, tests, and production build.
Gate: reliable enough for regular use.
Phase 9: Optional automation
Only after the manual flow is reliable: - Suggest/select unused
topics. - Warn on duplicates. - Generate from a topic queue. - Add local
scheduling if needed. - Add notifications only if useful. - Keep public
publishing out of the MVP and require human review.
Phase 10: Release
- Complete README and troubleshooting.
- Verify no secrets are committed.
- Run all checks and a production build.
- Produce a sample export.
- Document limitations and tag a stable version.
17. Claude Code operating rules
Before coding: 1. Inspect existing files and package configuration. 2.
Read this document and CLAUDE.md. 3. Summarize the current phase and
intended changes. 4. Identify important assumptions.
During development: - Work phase by phase and keep the app runnable. -
Prefer simple solutions over speculative abstractions. - Avoid
unnecessary infrastructure and dependencies. - Keep API calls
server-side. - Use mocked API responses in tests. - Do not fabricate
command results. - Do not suppress type errors with broad any or empty
catch blocks. - Do not implement image generation when HTML/CSS solves
the task. - Do not add publishing before the core product works. - Do
not claim visual quality is good without rendering and inspecting
output. - Do not overwrite the original creator photo. - Do not commit
secrets.
At the end of each phase: 1. Run relevant tests. 2. Run lint and
typecheck. 3. Run production build when practical. 4. Summarize changed
files and actual test results. 5. List known issues honestly. 6. State
the next phase. 7. Do not claim a phase is complete if its acceptance
gate is unmet.
When a failure occurs, inspect the root cause, fix it, rerun the failing
check, and do not proceed past a blocking issue without explaining it.
18. Suggested scripts
Adapt these to the actual project setup; do not add broken scripts.
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
19. First instruction to Claude Code
Start by inspecting the repository and environment. Do not generate the
entire application in one huge patch.
1. Confirm project state.
2. Check Node and package manager versions.
3. Verify current official Gemini SDK and model configuration.
4. Present a concise plan.
5. Implement Phase 1 only.
6. Run the app and report actual results.
7. Proceed to Phase 2 only after Phase 1 is verified.
If the repository is empty, initialize it. If it already contains work,
preserve and reuse what makes sense.
20. Not part of the MVP
Do not let these delay the first release: - Automated public research. -
Instagram publishing. - Cloud deployment. - Multi-user SaaS. - Advanced
analytics integrations. - Multiple social platforms. - AI-generated
illustrations on every slide. - Complex workflow engines.
Add them only when the core local workflow is reliable.
Final product principle
Topic → Gemini structured content → Zod validation → reusable HTML/CSS
templates → Playwright PNG rendering → layout checks → preview →
caption + ZIP export.
Use AI where it adds value, deterministic code where consistency
matters, and human review before publishing.