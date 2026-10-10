import { z } from "zod";
import { TEMPLATE_NAMES } from "@/templates/themes";

/**
 * Runtime source of truth for carousel content. Limits are deliberately tight:
 * templates use fixed font sizes, so copy must fit rather than be shrunk.
 */
export const LIMITS = {
  minSlides: 3,
  maxSlides: 12,
  seriesName: 40,
  seriesPart: 20,
  headline: 80,
  subtitle: 140,
  title: 70,
  description: 280,
  bulletCount: 6,
  bullet: 110,
  tip: 160,
  codeLines: 14,
  codeChars: 700,
  comparisonRows: 6,
  comparisonCell: 80,
  caption: 2_000,
  cta: 120,
  hashtagCount: 15,
  hashtag: 40,
} as const;

const text = (max: number) => z.string().trim().min(1).max(max);

export const CATEGORIES = [
  "ai-for-developers",
  "software-engineering",
  "product-building",
  "app-ideas",
  "startup-breakdowns",
  "developer-workflows",
  "launch-checklists",
] as const;
export const categorySchema = z.enum(CATEGORIES);

export const SLIDE_TYPES = ["content", "code", "comparison", "checklist", "closing"] as const;
export const slideTypeSchema = z.enum(SLIDE_TYPES);

const codeBlock = z
  .string()
  .max(LIMITS.codeChars)
  .refine((value) => value.split("\n").length <= LIMITS.codeLines, {
    message: `Code must be at most ${LIMITS.codeLines} lines`,
  });

const baseSlide = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/, "Slide id must be lowercase letters, digits, dashes"),
  title: text(LIMITS.title),
  description: text(LIMITS.description).optional(),
  tip: text(LIMITS.tip).optional(),
  visualType: z.enum(["icon", "diagram", "ui_mockup", "code", "none"]).optional(),
});

const bullets = z.array(text(LIMITS.bullet)).max(LIMITS.bulletCount);

export const contentSlideSchema = baseSlide.extend({
  type: z.literal("content"),
  bullets: bullets.optional(),
});

export const codeSlideSchema = baseSlide.extend({
  type: z.literal("code"),
  code: z
    .strictObject({
      language: z.string().regex(/^[a-z0-9+#-]{1,20}$/i),
      before: codeBlock.optional(),
      after: codeBlock.optional(),
      explanation: text(LIMITS.description).optional(),
    })
    .refine((c) => Boolean(c.before || c.after), {
      message: "Code slide needs a `before` or `after` snippet",
    }),
});

export const comparisonSlideSchema = baseSlide.extend({
  type: z.literal("comparison"),
  comparison: z.strictObject({
    leftTitle: text(30),
    rightTitle: text(30),
    rows: z
      .array(
        z.strictObject({ left: text(LIMITS.comparisonCell), right: text(LIMITS.comparisonCell) }),
      )
      .min(1)
      .max(LIMITS.comparisonRows),
  }),
});

export const checklistSlideSchema = baseSlide.extend({
  type: z.literal("checklist"),
  bullets: bullets.min(2),
});

export const closingSlideSchema = baseSlide.extend({
  type: z.literal("closing"),
  bullets: bullets.max(3).optional(),
});

export const slideSchema = z.discriminatedUnion("type", [
  contentSlideSchema,
  codeSlideSchema,
  comparisonSlideSchema,
  checklistSlideSchema,
  closingSlideSchema,
]);

export const coverSchema = z.strictObject({
  headline: text(LIMITS.headline),
  subtitle: text(LIMITS.subtitle),
  photoPosition: z.enum(["left", "right"]).optional(),
});

export const captionSchema = z.strictObject({
  caption: text(LIMITS.caption),
  cta: text(LIMITS.cta),
  hashtags: z
    .array(
      z
        .string()
        .trim()
        .regex(/^#?[\p{L}\p{N}_]+$/u, "Invalid hashtag")
        .max(LIMITS.hashtag),
    )
    .max(LIMITS.hashtagCount),
});

export const carouselContentSchema = z
  .strictObject({
    seriesName: text(LIMITS.seriesName),
    seriesPart: text(LIMITS.seriesPart).optional(),
    cover: coverSchema,
    // `slides` excludes the cover, so total = slides.length + 1.
    slides: z
      .array(slideSchema)
      .min(LIMITS.minSlides - 1)
      .max(LIMITS.maxSlides - 1),
    caption: captionSchema,
  })
  .superRefine((content, ctx) => {
    const last = content.slides.at(-1);
    if (last?.type !== "closing") {
      ctx.addIssue({
        code: "custom",
        path: ["slides"],
        message: "Last slide must be a closing slide",
      });
    }
    if (content.slides.filter((s) => s.type === "closing").length > 1) {
      ctx.addIssue({ code: "custom", path: ["slides"], message: "Only one closing slide allowed" });
    }
    const ids = new Set<string>();
    content.slides.forEach((slide, index) => {
      if (ids.has(slide.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["slides", index, "id"],
          message: "Duplicate slide id",
        });
      }
      ids.add(slide.id);
    });
  });

export type Category = z.infer<typeof categorySchema>;
export type Slide = z.infer<typeof slideSchema>;
export type SlideType = Slide["type"];
export type Cover = z.infer<typeof coverSchema>;
export type CaptionContent = z.infer<typeof captionSchema>;
export type CarouselContent = z.infer<typeof carouselContentSchema>;

/** Total slides including the cover. */
export function totalSlideCount(content: Pick<CarouselContent, "slides">): number {
  return content.slides.length + 1;
}

export type ValidationResult =
  | { ok: true; data: CarouselContent }
  | { ok: false; issues: Array<{ path: string; message: string }> };

export function validateCarousel(input: unknown): ValidationResult {
  const result = carouselContentSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      message: issue.message,
    })),
  };
}

/**
 * A carousel file: what Claude Code writes into content/*.json and what the app imports.
 * Only `content` is required.
 */
export const carouselFileSchema = z.strictObject({
  topic: z.string().trim().min(3).max(160).optional(),
  category: categorySchema.default("product-building"),
  template: z.enum(TEMPLATE_NAMES).default("ship-it-right"),
  includePhoto: z.boolean().default(true),
  content: carouselContentSchema,
});
export type CarouselFile = z.infer<typeof carouselFileSchema>;

/** Accept a full carousel file or bare content (an object with `cover` at the root). */
export function parseCarouselFile(input: unknown) {
  const wrapped =
    input && typeof input === "object" && "cover" in input ? { content: input } : input;
  return carouselFileSchema.safeParse(wrapped);
}

export const CATEGORY_LABELS: Record<Category, string> = {
  "ai-for-developers": "AI for developers",
  "software-engineering": "Software engineering",
  "product-building": "Product building & shipping",
  "app-ideas": "App ideas & MVPs",
  "startup-breakdowns": "Startup/product breakdowns",
  "developer-workflows": "Developer workflows & tools",
  "launch-checklists": "Security, a11y, performance & launch",
};
