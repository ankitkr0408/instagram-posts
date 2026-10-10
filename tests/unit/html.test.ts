import { describe, expect, it } from "vitest";
import { html, raw } from "@/lib/render/html";
import { renderSlideHtml } from "@/templates/layout";
import { sampleCarousel } from "@/lib/fixtures/sample-carousel";
import { TEMPLATES } from "@/templates/themes";

describe("html", () => {
  it("escapes interpolated text by default", () => {
    expect(html`<p>${'<img src=x onerror="alert(1)">'}</p>`.value).toBe(
      "<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>",
    );
  });

  it("only passes through explicitly raw values and nested templates", () => {
    expect(html`<p>${raw("<b>ok</b>")}${html`<i>${"&"}</i>`}</p>`.value).toBe(
      "<p><b>ok</b><i>&amp;</i></p>",
    );
  });

  it("never lets slide content inject markup", () => {
    const content = structuredClone(sampleCarousel);
    content.cover.headline = "</style><script>alert(1)</script>";
    const doc = renderSlideHtml(
      {
        content,
        theme: TEMPLATES["ship-it-right"].theme,
        branding: { name: "n", handle: "@h", photo: null },
        index: 0,
      },
      "",
    );
    expect(doc).not.toContain("<script>");
    expect(doc).toContain("&lt;script&gt;");
  });
});
