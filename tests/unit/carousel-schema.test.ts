import { describe, expect, it } from "vitest";
import { LIMITS, totalSlideCount, validateCarousel } from "@/lib/schemas/carousel.schema";
import { sampleCarousel } from "@/lib/fixtures/sample-carousel";

const clone = () => structuredClone(sampleCarousel);

describe("carousel schema", () => {
  it("accepts the 9-slide sample", () => {
    const result = validateCarousel(sampleCarousel);
    expect(result.ok).toBe(true);
    expect(totalSlideCount(sampleCarousel)).toBe(9);
  });

  it("rejects a carousel that does not end with a closing slide", () => {
    const content = clone();
    content.slides.pop();
    const result = validateCarousel(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0].message).toMatch(/closing/);
  });

  it("enforces the maximum slide count", () => {
    const content = clone();
    const filler = content.slides[0];
    while (content.slides.length < LIMITS.maxSlides) {
      content.slides.unshift({ ...filler, id: `extra-${content.slides.length}` });
    }
    expect(validateCarousel(content).ok).toBe(false);
  });

  it("enforces text limits instead of letting templates shrink fonts", () => {
    const content = clone();
    content.cover.headline = "x".repeat(LIMITS.headline + 1);
    const result = validateCarousel(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0].path).toBe("cover.headline");
  });

  it("rejects unexpected keys that could reach the renderer", () => {
    const content = clone() as Record<string, unknown>;
    content.html = "<script>alert(1)</script>";
    expect(validateCarousel(content).ok).toBe(false);

    const withSlideKey = clone();
    (withSlideKey.slides[0] as Record<string, unknown>).style = "position:absolute";
    expect(validateCarousel(withSlideKey).ok).toBe(false);
  });

  it("rejects unknown slide types and duplicate ids", () => {
    const badType = clone();
    (badType.slides[0] as { type: string }).type = "video";
    expect(validateCarousel(badType).ok).toBe(false);

    const dupe = clone();
    dupe.slides[1].id = dupe.slides[0].id;
    expect(validateCarousel(dupe).ok).toBe(false);
  });

  it("requires a code snippet on code slides and caps code length", () => {
    const content = clone();
    const code = content.slides.find((s) => s.type === "code");
    if (code?.type !== "code") throw new Error("fixture missing code slide");
    code.code = { language: "ts" };
    expect(validateCarousel(content).ok).toBe(false);

    code.code = {
      language: "ts",
      after: Array(LIMITS.codeLines + 1)
        .fill("x")
        .join("\n"),
    };
    expect(validateCarousel(content).ok).toBe(false);
  });

  it("requires at least two checklist items", () => {
    const content = clone();
    const checklist = content.slides.find((s) => s.type === "checklist");
    if (checklist?.type !== "checklist") throw new Error("fixture missing checklist");
    checklist.bullets = ["only one"];
    expect(validateCarousel(content).ok).toBe(false);
  });

  it("requires highlights to be part of the title", () => {
    const content = clone();
    content.cover.highlight = "not in headline";
    expect(validateCarousel(content).ok).toBe(false);
    content.cover.highlight = "API keys";
    content.slides[0].highlight = "problem";
    expect(validateCarousel(content).ok).toBe(true);
  });

  it("validates the new slide types", () => {
    const content = clone();
    const closing = content.slides.pop()!;
    content.slides.push(
      { id: "s1", type: "statement", title: "Ship less, ship better" },
      { id: "s2", type: "stat", title: "Target", stat: { value: "API 36", label: "Android 16" } },
      { id: "s3", type: "steps", title: "Flow", steps: [{ label: "Build" }, { label: "Test" }] },
      { id: "s4", type: "dodont", title: "Listing", do: ["Real screens"], dont: ["Slogans"] },
      { id: "s5", type: "mockup", title: "Screen", mockup: { rows: ["Privacy policy"] } },
    );
    content.slides = content.slides.slice(-6);
    content.slides.push(closing);
    expect(validateCarousel(content)).toMatchObject({ ok: true });

    const bad = structuredClone(content);
    const steps = bad.slides.find((s) => s.type === "steps");
    if (steps?.type === "steps") steps.steps = [{ label: "only one" }];
    expect(validateCarousel(bad).ok).toBe(false);

    const noScreen = structuredClone(content);
    const mock = noScreen.slides.find((s) => s.type === "mockup");
    if (mock?.type === "mockup") mock.mockup = {};
    expect(validateCarousel(noScreen).ok).toBe(false);
  });

  it("rejects unsafe icon names and image paths", () => {
    const content = clone();
    content.slides[0].icon = "../../etc/passwd";
    expect(validateCarousel(content).ok).toBe(false);
    const content2 = clone();
    content2.slides[0] = {
      id: "m",
      type: "mockup",
      title: "x",
      mockup: { image: "../secret.png" },
    };
    expect(validateCarousel(content2).ok).toBe(false);
  });
});
