import { html, raw, type RawHtml } from "@/lib/render/html";
import type { CarouselContent, Slide } from "@/lib/schemas/carousel.schema";
import type { Theme } from "@/templates/themes";

export const CANVAS = { width: 1080, height: 1350 } as const;

export type Branding = {
  name: string;
  handle: string;
  /** Data URI of the creator photo, or null for the photo-free layout. */
  photo: { src: string; focalX: number; focalY: number; zoom: number } | null;
};

export type SlideContext = {
  content: CarouselContent;
  theme: Theme;
  branding: Branding;
  /** 0 = cover, 1..n = content.slides[index - 1] */
  index: number;
};

const ICON = {
  arrow: raw(
    `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  ),
  check: raw(
    `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  ),
  bulb: raw(
    `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>`,
  ),
  sparkle: raw(
    `<svg class="doodle" width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M50 8v24M50 68v24M8 50h24M68 50h24M22 22l12 12M66 66l12 12M78 22L66 34M34 66L22 78"/></svg>`,
  ),
  squiggle: raw(
    `<svg class="doodle" width="220" height="40" viewBox="0 0 220 40" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M5 20c20-18 35 18 55 0s35 18 55 0 35 18 55 0 30 14 45 4"/></svg>`,
  ),
};

function css(t: Theme): string {
  return `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${CANVAS.width}px;height:${CANVAS.height}px;background:${t.bg}}
body{font-family:"Inter",sans-serif;color:${t.text};-webkit-font-smoothing:antialiased}
.slide{width:${CANVAS.width}px;height:${CANVAS.height}px;padding:80px 88px 72px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.top,.bottom{display:flex;align-items:center;justify-content:space-between;flex:none}
.pill{font:600 24px/1 "Inter";letter-spacing:.06em;text-transform:uppercase;padding:14px 22px;border-radius:999px;background:${t.greenSoft};color:${t.text}}
.count{font:500 26px/1 "JetBrains Mono";color:${t.muted}}
.body{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:36px;padding:56px 0 40px}
.bottom{border-top:2px solid ${t.border};padding-top:28px;font:600 26px/1 "Inter";color:${t.muted}}
.swipe{display:flex;align-items:center;gap:10px;color:${t.green}}
h1,h2{font-family:"Space Grotesk",sans-serif;font-weight:700;letter-spacing:-.025em}
h1{font-size:100px;line-height:1.02}
h2{font-size:66px;line-height:1.08}
.sub{font-size:38px;line-height:1.4;color:${t.muted};font-weight:500}
.desc{font-size:35px;line-height:1.45;color:${t.text}}
.num{width:84px;height:84px;border-radius:24px;background:${t.green};color:${t.onGreen};display:flex;align-items:center;justify-content:center;font:700 36px/1 "Space Grotesk";flex:none}
.list{list-style:none;display:flex;flex-direction:column;gap:20px}
.list li{display:flex;gap:24px;align-items:flex-start;font-size:33px;line-height:1.4;padding:24px 28px;border-radius:24px;background:${t.card};border:2px solid ${t.border}}
.dot{width:18px;height:18px;border-radius:6px;flex:none;margin-top:15px;background:${t.green}}
.c0{background:${t.green}}.c2{background:${t.pink}}.c3{background:${t.blue}}
.slide:not([data-type=cover]):not([data-type=closing]) .body{justify-content:safe center}
.tip{display:flex;gap:22px;align-items:flex-start;background:${t.yellow};border-radius:28px;padding:30px 34px;font-size:31px;line-height:1.4;font-weight:500}
.tip b{display:block;font:700 22px/1 "Inter";letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.code{border-radius:28px;background:${t.codeBg};color:${t.codeText};padding:30px 34px;display:flex;flex-direction:column;gap:16px}
.code pre{font:400 25px/1.5 "JetBrains Mono",monospace;white-space:pre;overflow:hidden}
.tag{align-self:flex-start;font:700 20px/1 "Inter";letter-spacing:.08em;text-transform:uppercase;padding:10px 16px;border-radius:999px;color:#141414}
.tag.bad{background:#FFB4C6}.tag.good{background:#9FE7B8}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.cmp .head{font:700 28px/1.2 "Space Grotesk";padding:22px 26px;border-radius:22px}
.cmp .head.l{background:${t.pink}}.cmp .head.r{background:${t.greenSoft}}
.cmp .cell{font-size:30px;line-height:1.35;padding:24px 26px;border-radius:22px;background:${t.card};border:2px solid ${t.border}}
.check li{align-items:center}
.box{width:52px;height:52px;border-radius:16px;background:${t.green};color:${t.onGreen};display:flex;align-items:center;justify-content:center;flex:none}
.doodle{color:${t.green};opacity:.9}
.cover-art{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:28px}
.cover-art.noPhoto{grid-template-columns:1fr}
.photo{border-radius:40px;overflow:hidden;background:${t.blue};min-height:0}
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.side{border-radius:40px;background:${t.yellow};padding:44px;display:flex;flex-direction:column;justify-content:space-between}
.side.alt{background:${t.blue}}
.side p{font:700 46px/1.15 "Space Grotesk";letter-spacing:-.02em}
.blocks{display:flex;gap:16px}.blocks span{height:22px;border-radius:999px;flex:1}
.cta{margin-top:auto;border-radius:32px;background:${t.green};color:${t.onGreen};padding:40px 44px;display:flex;flex-direction:column;gap:24px}
.cta p{font:700 40px/1.25 "Space Grotesk"}
.who{display:flex;align-items:center;gap:20px;font:600 28px/1.2 "Inter"}
.avatar{width:84px;height:84px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.25);flex:none}
.avatar img{width:100%;height:100%;object-fit:cover}
`;
}

function photoImg(photo: NonNullable<Branding["photo"]>): RawHtml {
  const pos = `${photo.focalX}% ${photo.focalY}%`;
  return html`<img
    data-check-image
    src="${photo.src}"
    alt=""
    style="object-position:${pos};transform:scale(${photo.zoom});transform-origin:${pos}"
  />`;
}

function bulletList(items: string[] | undefined): RawHtml | null {
  if (!items?.length) return null;
  return html`<ul class="list">
    ${items.map((b) => html`<li><span class="dot"></span><span>${b}</span></li>`)}
  </ul>`;
}

function tip(text: string | undefined): RawHtml | null {
  if (!text) return null;
  return html`<div class="tip">
    ${ICON.bulb}
    <div><b>Tip</b>${text}</div>
  </div>`;
}

function cover({ content, branding }: SlideContext): RawHtml {
  const { headline, subtitle, photoPosition = "right" } = content.cover;
  const side = html`<div class="side">
    ${ICON.sparkle}
    <p>Swipe to learn</p>
    <div class="blocks">
      <span class="c0"></span><span class="c2"></span><span class="c3"></span>
    </div>
  </div>`;
  const art = branding.photo
    ? html`<div class="cover-art">
        ${photoPosition === "left" ? html`<div class="photo">${photoImg(branding.photo)}</div>` : side}
        ${photoPosition === "left" ? side : html`<div class="photo">${photoImg(branding.photo)}</div>`}
      </div>`
    : html`<div class="cover-art noPhoto">${side}</div>`;
  return html`<h1 data-fit-text>${headline}</h1>
    <p class="sub">${subtitle}</p>
    ${art}`;
}

const NUMBERED: Slide["type"][] = ["content", "code", "comparison"];

/** Point number shown on the badge: counts only content/code/comparison slides. */
function pointNumber(slides: Slide[], index: number): number | null {
  if (!NUMBERED.includes(slides[index].type)) return null;
  return slides.slice(0, index + 1).filter((s) => NUMBERED.includes(s.type)).length;
}

function slideBody(slide: Slide, number: number | null, ctx: SlideContext): RawHtml {
  const heading = html`<div style="display:flex;gap:28px;align-items:flex-start">
    ${number === null ? null : html`<span class="num">${String(number).padStart(2, "0")}</span>`}
    <h2>${slide.title}</h2>
  </div>`;
  const desc = slide.description ? html`<p class="desc">${slide.description}</p>` : null;

  switch (slide.type) {
    case "content":
      return html`${heading}${desc}${bulletList(slide.bullets)}${tip(slide.tip)}`;
    case "code": {
      const { before, after, explanation } = slide.code;
      return html`${heading}${desc}
      ${
        before
          ? html`<div class="code">
              <span class="tag bad">${after ? "Before" : "Example"}</span>
              <pre data-check-x>${before}</pre>
            </div>`
          : null
      }
      ${
        after
          ? html`<div class="code">
              <span class="tag good">${before ? "After" : "Example"}</span>
              <pre data-check-x>${after}</pre>
            </div>`
          : null
      }
      ${explanation ? html`<p class="desc">${explanation}</p>` : null} ${tip(slide.tip)}`;
    }
    case "comparison": {
      const { leftTitle, rightTitle, rows } = slide.comparison;
      return html`${heading}${desc}
        <div class="cmp">
          <div class="head l">${leftTitle}</div>
          <div class="head r">${rightTitle}</div>
          ${rows.map(
            (r) =>
              html`<div class="cell">${r.left}</div>
                <div class="cell">${r.right}</div>`,
          )}
        </div>
        ${tip(slide.tip)}`;
    }
    case "checklist":
      return html`${heading}${desc}
        <ul class="list check">
          ${slide.bullets.map((b) => html`<li><span class="box">${ICON.check}</span><span>${b}</span></li>`)}
        </ul>
        ${tip(slide.tip)}`;
    case "closing": {
      const { branding, content } = ctx;
      return html`${ICON.squiggle}
        <h2 style="font-size:80px">${slide.title}</h2>
        ${desc}${bulletList(slide.bullets)}
        <div class="cta">
          <p>${content.caption.cta}</p>
          <div class="who">
            ${branding.photo ? html`<span class="avatar">${photoImg(branding.photo)}</span>` : null}
            <span>${branding.name}<br /><span style="opacity:.8">${branding.handle}</span></span>
          </div>
        </div>`;
    }
  }
}

/** Full standalone HTML document for one slide. */
export function renderSlideHtml(ctx: SlideContext, fontCss: string): string {
  const { content, index, theme, branding } = ctx;
  const total = content.slides.length + 1;
  const slide = index === 0 ? null : content.slides[index - 1];
  const series = [content.seriesName, content.seriesPart].filter(Boolean).join(" · ");
  const isLast = index === total - 1;

  const doc = html`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          ${raw(fontCss)}
          ${raw(css(theme))}
        </style>
      </head>
      <body>
        <div class="slide" data-type="${slide?.type ?? "cover"}">
          <header class="top">
            <span class="pill">${series}</span>
            <span class="count"
              >${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span
            >
          </header>
          <main class="body" data-fit>
            ${slide ? slideBody(slide, pointNumber(content.slides, index - 1), ctx) : cover(ctx)}
          </main>
          <footer class="bottom">
            <span>${branding.handle}</span>
            ${isLast ? html`<span>Save · Share</span>` : html`<span class="swipe">Swipe ${ICON.arrow}</span>`}
          </footer>
        </div>
      </body>
    </html>`;
  return doc.value;
}
