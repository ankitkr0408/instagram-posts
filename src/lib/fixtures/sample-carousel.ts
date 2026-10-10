import type { CarouselContent } from "@/lib/schemas/carousel.schema";

/** Hand-written 9-slide sample used for template work and tests. No AI involved. */
export const sampleCarousel: CarouselContent = {
  seriesName: "Ship It Right",
  seriesPart: "Part 1",
  cover: {
    headline: "Stop leaking API keys from your frontend",
    subtitle: "A practical checklist for keeping secrets server-side in modern web apps",
    photoPosition: "right",
  },
  slides: [
    {
      id: "problem",
      type: "content",
      title: "The problem",
      description:
        "Anything bundled into client JavaScript can be read by anyone who opens DevTools. That includes keys you thought were hidden.",
      tip: "If the browser can see it, assume it's public.",
    },
    {
      id: "env-prefix",
      type: "content",
      title: "Know your public prefixes",
      description: "Frameworks expose some env vars to the browser on purpose.",
      bullets: [
        "Next.js: NEXT_PUBLIC_* ships to the client",
        "Vite: VITE_* ships to the client",
        "Keep secret keys without those prefixes",
      ],
    },
    {
      id: "proxy",
      type: "code",
      title: "Call the API from the server",
      code: {
        language: "ts",
        before: 'fetch(url, {\n  headers: { key: "YOUR_API_KEY" },\n});',
        after:
          "// app/api/generate/route.ts\nexport async function POST(req: Request) {\n  const key = process.env.API_KEY;\n  // call the provider here\n}",
        explanation: "The browser talks to your route; only the server holds the key.",
      },
    },
    {
      id: "compare",
      type: "comparison",
      title: "Client vs server",
      comparison: {
        leftTitle: "In the browser",
        rightTitle: "On the server",
        rows: [
          { left: "Visible in DevTools", right: "Never sent to users" },
          { left: "Easy to copy and abuse", right: "Rate-limited by you" },
          { left: "Rotating means redeploy", right: "Rotate in env config" },
        ],
      },
    },
    {
      id: "git",
      type: "content",
      title: "Keep keys out of Git",
      bullets: [
        "Put real values in .env.local",
        "Commit only .env.example with blanks",
        "Add a secret scanner to CI",
      ],
      tip: "Leaked once? Rotate the key. Deleting the commit isn't enough.",
    },
    {
      id: "limits",
      type: "content",
      title: "Limit the blast radius",
      bullets: [
        "Restrict keys by domain, IP, or API where supported",
        "Set usage quotas and billing alerts",
        "Use separate keys for dev and prod",
      ],
    },
    {
      id: "checklist",
      type: "checklist",
      title: "Before you ship",
      bullets: [
        "No secrets in client bundles",
        "Server routes validate input",
        ".env files ignored by Git",
        "Keys scoped and quota-limited",
        "Rotation plan documented",
      ],
    },
    {
      id: "closing",
      type: "closing",
      title: "Secrets belong on the server",
      description: "Treat every client-side value as public and design from there.",
    },
  ],
  caption: {
    caption:
      "Frontend code is public code. If an API key is in your bundle, someone can find it.\n\nThis carousel walks through keeping secrets server-side, keeping them out of Git, and limiting damage if one leaks.",
    cta: "Save this for your next launch and follow for more ship-it-right checklists.",
    hashtags: ["#webdev", "#security", "#nextjs", "#javascript", "#devtips"],
  },
};
