import { describe, expect, it } from "vitest";
import { formatCaption, normalizeHashtags } from "@/lib/caption/format-caption";

describe("normalizeHashtags", () => {
  it("adds #, strips junk, and dedupes case-insensitively", () => {
    expect(normalizeHashtags(["webdev", "#WebDev", "##ai", "next.js", " ", "#"])).toEqual([
      "#webdev",
      "#ai",
      "#nextjs",
    ]);
  });

  it("caps the number of hashtags", () => {
    expect(normalizeHashtags(["a", "b", "c", "d"], 2)).toEqual(["#a", "#b"]);
  });
});

describe("formatCaption", () => {
  it("joins caption, CTA and hashtags with blank lines", () => {
    const text = formatCaption({
      caption: "  Frontend code is public code.  ",
      cta: "Save this.",
      hashtags: ["security", "#webdev"],
    });
    expect(text).toBe("Frontend code is public code.\n\nSave this.\n\n#security #webdev\n");
  });

  it("omits the hashtag block when there are none", () => {
    expect(formatCaption({ caption: "Body", cta: "CTA", hashtags: [] })).toBe("Body\n\nCTA\n");
  });
});
