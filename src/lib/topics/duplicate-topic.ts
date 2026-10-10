const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "should",
  "the",
  "to",
  "vs",
  "what",
  "when",
  "why",
  "with",
  "you",
  "your",
]);

export function normalizeTopic(topic: string): string {
  return topic
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(topic: string): Set<string> {
  return new Set(
    normalizeTopic(topic)
      .split(" ")
      .filter((t) => t && !STOP_WORDS.has(t))
      // Cheap stemming so "checklist"/"checklists" match.
      .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t)),
  );
}

/** Jaccard similarity of content words, 0..1. */
export function topicSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

type DuplicateMatch = { topic: string; kind: "exact" | "near"; similarity: number };

/**
 * Find prior topics that match exactly or closely. This only warns: the user
 * may intentionally reuse a topic.
 */
export function findDuplicateTopics(
  topic: string,
  previous: string[],
  threshold = 0.6,
): DuplicateMatch[] {
  const normalized = normalizeTopic(topic);
  return previous
    .map((prior): DuplicateMatch | null => {
      if (normalizeTopic(prior) === normalized)
        return { topic: prior, kind: "exact", similarity: 1 };
      const similarity = topicSimilarity(topic, prior);
      return similarity >= threshold ? { topic: prior, kind: "near", similarity } : null;
    })
    .filter((m): m is DuplicateMatch => m !== null)
    .sort((x, y) => y.similarity - x.similarity);
}
