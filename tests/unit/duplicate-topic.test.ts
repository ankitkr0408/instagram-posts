import { describe, expect, it } from "vitest";
import { findDuplicateTopics, normalizeTopic, topicSimilarity } from "@/lib/topics/duplicate-topic";

describe("duplicate topic detection", () => {
  const previous = [
    "Stop leaking API keys from your frontend",
    "Launch checklist for Next.js apps",
    "How to write better prompts for code review",
  ];

  it("normalizes punctuation and case", () => {
    expect(normalizeTopic("  Next.js — Launch CHECKLIST! ")).toBe("next js launch checklist");
  });

  it("flags exact duplicates regardless of formatting", () => {
    const [match] = findDuplicateTopics("stop leaking api keys from your FRONTEND!", previous);
    expect(match).toMatchObject({ kind: "exact", similarity: 1 });
  });

  it("flags near duplicates", () => {
    const matches = findDuplicateTopics("Next.js launch checklists", previous);
    expect(matches[0]).toMatchObject({ topic: "Launch checklist for Next.js apps", kind: "near" });
  });

  it("does not flag unrelated topics", () => {
    expect(findDuplicateTopics("Accessibility basics for mobile forms", previous)).toEqual([]);
    expect(topicSimilarity("", "anything")).toBe(0);
  });
});
