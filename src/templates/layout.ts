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

/** Pre-resolved, trusted assets keyed by slide id (loaded by the renderer). */
export type SlideAssets = {
  /** Lucide SVG markup. */
  icons: Record<string, string>;
  /** Shiki-highlighted HTML for code snippets. */
  code: Record<string, { before?: string; after?: string }>;
  /** Data URIs for mockup screenshots. */
  images: Record<string, string>;
};

const NO_ASSETS: SlideAssets = { icons: {}, code: {}, images: {} };

type SlideContext = {
  content: CarouselContent;
  theme: Theme;
  branding: Branding;
  /** 0 = cover, 1..n = content.slides[index - 1] */
  index: number;
  assets?: SlideAssets;
};

const svg = (body: string, size = 34, width = 2.4) =>
  raw(
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
  );

const ICON = {
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>', 40, 2.6),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 30, 3),
  cross: svg('<path d="M6 6l12 12M18 6L6 18"/>', 30, 3),
  bulb: svg(
    '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    34,
    2,
  ),
  squiggle: raw(
    `<svg class="doodle" width="220" height="40" viewBox="0 0 220 40" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M5 20c20-18 35 18 55 0s35 18 55 0 35 18 55 0 30 14 45 4"/></svg>`,
  ),
};

/** Shared structure + the classic look. Colors come from theme tokens. */
function baseCss(t: Theme): string {
  return `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${CANVAS.width}px;height:${CANVAS.height}px;background:var(--bg)}
body{font-family:"Inter",sans-serif;color:${t.text};-webkit-font-smoothing:antialiased}
.slide{width:${CANVAS.width}px;height:${CANVAS.height}px;padding:80px 88px 72px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.top,.bottom,.meta{display:flex;align-items:center;justify-content:space-between;flex:none}
.progress{display:none}
.top{flex-direction:column;align-items:stretch}
.pill{font:600 24px/1 "Inter";letter-spacing:.06em;text-transform:uppercase;padding:14px 22px;border-radius:999px;background:${t.greenSoft};color:${t.text}}
.count{font:500 26px/1 "JetBrains Mono";color:${t.muted}}
.body{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:36px;padding:56px 0 40px}
.slide:not([data-type=cover]):not([data-type=closing]) .body{justify-content:safe center}
.bottom{border-top:2px solid ${t.border};padding-top:28px;font:600 26px/1 "Inter";color:${t.muted}}
.swipe{display:flex;align-items:center;gap:10px;color:${t.green}}
.brand{display:flex;align-items:center;gap:16px}
.mini-avatar{width:64px;height:64px;border-radius:50%;overflow:hidden;flex:none;border:3px solid ${t.green}}
.mini-avatar img{width:100%;height:100%;object-fit:cover}
h1,h2,h3{font-family:"Space Grotesk",sans-serif;font-weight:700;letter-spacing:-.025em}
h1{font-size:100px;line-height:1.02}
h2{font-size:66px;line-height:1.08}
h3{font-size:34px;line-height:1.2;color:${t.muted}}
mark{color:inherit;background:linear-gradient(transparent 58%,${t.yellow} 58%);padding:0 .05em}
.sub{font-size:38px;line-height:1.4;color:${t.muted};font-weight:500}
.desc{font-size:35px;line-height:1.45;color:${t.text}}
.heading{display:flex;gap:28px;align-items:flex-start}
.num{width:84px;height:84px;border-radius:24px;background:${t.green};color:${t.onGreen};display:flex;align-items:center;justify-content:center;font:700 36px/1 "Space Grotesk";flex:none}
.icon{width:120px;height:120px;border-radius:32px;background:${t.greenSoft};color:${t.green};display:flex;align-items:center;justify-content:center;flex:none}
.icon svg{width:64px;height:64px}
.list{list-style:none;display:flex;flex-direction:column;gap:20px}
.list li{display:flex;gap:24px;align-items:flex-start;font-size:33px;line-height:1.4;padding:24px 28px;border-radius:24px;background:${t.card};border:2px solid ${t.border}}
.dot{width:18px;height:18px;border-radius:6px;flex:none;margin-top:15px;background:${t.green}}
.tip{display:flex;gap:22px;align-items:flex-start;background:${t.yellow};border-radius:28px;padding:30px 34px;font-size:31px;line-height:1.4;font-weight:500}
.tip b{display:block;font:700 22px/1 "Inter";letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.code{border-radius:28px;background:${t.codeBg};color:${t.codeText};padding:30px 34px;display:flex;flex-direction:column;gap:16px}
.code pre{font:400 25px/1.5 "JetBrains Mono",monospace;white-space:pre;overflow:hidden;background:transparent!important}
.code pre code{font:inherit}
.code .line{display:inline-block;width:100%}
.code .line.hl{background:rgba(255,255,255,.12);box-shadow:-34px 0 0 rgba(255,255,255,.12),34px 0 0 rgba(255,255,255,.12)}
.dots{display:flex;gap:10px}.dots i{width:16px;height:16px;border-radius:50%;background:#FF5F57}.dots i+i{background:#FEBC2E}.dots i+i+i{background:#28C840}
.code-head{display:flex;align-items:center;gap:20px}
.tag{align-self:flex-start;font:700 20px/1 "Inter";letter-spacing:.08em;text-transform:uppercase;padding:10px 16px;border-radius:999px;color:#141414}
.tag.bad{background:#FFB4C6}.tag.good{background:#9FE7B8}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.cmp .head{font:700 28px/1.2 "Space Grotesk";padding:22px 26px;border-radius:22px}
.cmp .head.l{background:${t.pink}}.cmp .head.r{background:${t.greenSoft}}
.cmp .cell{font-size:30px;line-height:1.35;padding:24px 26px;border-radius:22px;background:${t.card};border:2px solid ${t.border}}
.check li{align-items:center}
.box{width:52px;height:52px;border-radius:16px;background:${t.green};color:${t.onGreen};display:flex;align-items:center;justify-content:center;flex:none}
.statement h2{font-size:108px;line-height:1.0}
.statement .desc{font-size:40px;color:${t.muted}}
.stat-value{font:700 240px/1 "Space Grotesk";letter-spacing:-.05em;color:${t.green};white-space:nowrap}
.stat-label{font-size:44px;line-height:1.3;font-weight:600}
.steps{list-style:none;display:flex;flex-direction:column;align-items:stretch}
.step{display:flex;gap:28px;align-items:center;padding:26px 30px;border-radius:26px;background:${t.card};border:2px solid ${t.border}}
.step-n{width:68px;height:68px;border-radius:50%;background:${t.green};color:${t.onGreen};display:flex;align-items:center;justify-content:center;font:700 32px/1 "Space Grotesk";flex:none}
.step b{display:block;font:700 38px/1.2 "Space Grotesk"}
.step span.detail{display:block;font-size:28px;line-height:1.35;color:${t.muted};margin-top:6px}
.step-arrow{display:flex;justify-content:center;color:${t.muted};padding:6px 0}
.dd{display:flex;flex-direction:column;gap:26px}
.dd-card{border-radius:28px;background:${t.card};border:2px solid ${t.border};overflow:hidden}
.dd-head{display:flex;align-items:center;gap:14px;font:700 32px/1 "Space Grotesk";padding:22px 30px}
.dd-card.bad .dd-head{background:${t.pink}}.dd-card.good .dd-head{background:${t.greenSoft}}
.dd-card ul{list-style:none;padding:20px 30px 26px;display:flex;flex-direction:column;gap:14px;font-size:33px;line-height:1.35}
.mock-grid{flex:1;min-height:0;display:grid;grid-template-columns:1fr 430px;gap:48px;align-items:center}
.mock-text{display:flex;flex-direction:column;gap:32px}
.mock-text .heading{flex-direction:column;gap:22px}
.mock-text h2{font-size:60px}
.mock-text .desc{font-size:34px}
.phone{height:100%;max-height:880px;justify-self:end;aspect-ratio:9/18;border:14px solid #111;border-radius:64px;background:#fff;overflow:hidden;position:relative;display:flex;flex-direction:column;box-shadow:0 30px 60px rgba(0,0,0,.18)}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top}
.notch{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:110px;height:28px;border-radius:20px;background:#111}
.screen{padding:72px 24px 24px;display:flex;flex-direction:column;gap:16px;color:#111;font-family:"Inter"}
.screen-title{font:700 34px/1.2 "Space Grotesk";padding:0 4px 8px}
.screen-row{display:flex;align-items:center;gap:14px;padding:20px 18px;border-radius:18px;background:#F2F2F2;font-size:25px;line-height:1.25;font-weight:600}
.screen-row i{width:34px;height:34px;border-radius:50%;background:${t.green};flex:none;display:flex;align-items:center;justify-content:center;color:#fff}
.screen-row i svg{width:18px;height:18px}
.doodle{color:${t.green};opacity:.9}
.slide[data-type=cover] .body{justify-content:center;gap:44px}
.teaser{align-self:flex-start;display:flex;align-items:center;gap:14px;font:700 36px/1 "Space Grotesk";padding:22px 30px;border-radius:999px;background:${t.green};color:${t.onGreen}}
.cta{margin-top:auto;border-radius:32px;background:${t.green};color:${t.onGreen};padding:40px 44px;display:flex;flex-direction:column;gap:24px}
.cta p{font:700 40px/1.25 "Space Grotesk"}
.who{display:flex;align-items:center;gap:20px;font:600 28px/1.2 "Inter"}
.avatar{width:84px;height:84px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.25);flex:none}
.avatar img{width:100%;height:100%;object-fit:cover}
`;
}

/** Bold Pop: color-blocked slides, huge type, thick outlines and hard shadows. */
function popCss(t: Theme): string {
  const ink = t.border;
  const card = `background:#fff;border:4px solid ${ink};box-shadow:8px 8px 0 ${ink}`;
  return `
.slide{padding:64px 80px 60px}
.top{flex-direction:column;align-items:stretch;gap:22px}
.progress{display:flex;gap:10px}
.progress i{flex:1;height:12px;border-radius:99px;background:rgba(17,17,17,.16)}
.progress i.on{background:${ink}}
.pill{background:#fff;border:3px solid ${ink};font-size:22px;padding:12px 20px}
.count{color:${ink};font-weight:600}
.body{gap:38px;padding:44px 0 36px}
.bottom{border-top:4px solid ${ink};color:${ink};font-size:28px}
.swipe{background:${ink};color:#fff;padding:14px 22px;border-radius:999px;font-size:26px}
h1{font-size:108px;line-height:1.08;letter-spacing:-.035em}
h2{font-size:80px;line-height:1.12;letter-spacing:-.03em}
h3{color:${ink};font-size:36px;text-transform:uppercase;letter-spacing:.04em}
mark{background:${ink};color:var(--bg);padding:0 .12em;border-radius:12px;line-height:1;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.sub{color:${ink};font-size:40px}
.desc{font-size:41px;line-height:1.38;font-weight:500}
.num{width:96px;height:96px;border-radius:24px;background:${ink};color:#fff;font-size:42px;transform:rotate(-4deg)}
.icon{width:150px;height:150px;border-radius:36px;${card};color:${ink};transform:rotate(-4deg)}
.icon svg{width:84px;height:84px;stroke-width:2.2}
.list{gap:22px}
.list li{font-size:38px;line-height:1.3;font-weight:600;padding:26px 30px;border-radius:24px;${card}}
.dot{width:22px;height:22px;border-radius:6px;background:${ink};margin-top:12px}
.tip{background:${ink};color:#fff;transform:rotate(-1.5deg);font-size:34px;border-radius:26px}
.code{${card};background:${t.codeBg};border-radius:28px}
.code pre{font-size:27px}
.tag.bad{background:#FF8A8A;border:3px solid ${ink}}.tag.good{background:#86EFAC;border:3px solid ${ink}}
.cmp .head{border:4px solid ${ink};font-size:32px}
.cmp .head.l{background:#FF8A8A}.cmp .head.r{background:#86EFAC}
.cmp .cell{${card};box-shadow:5px 5px 0 ${ink};font-size:31px;font-weight:600}
.box{background:${ink};color:#fff;width:60px;height:60px}
.statement h2{font-size:124px;line-height:1.1}
.statement .desc{color:${ink};font-size:44px}
.stat-value{color:${ink}}
.stat-value span{background:#fff;border:6px solid ${ink};box-shadow:14px 14px 0 ${ink};border-radius:40px;padding:0 40px;display:inline-block}
.stat-label{font-size:50px}
.step{${card};padding:28px 32px}
.step-n{background:${ink};color:#fff;width:76px;height:76px;font-size:36px}
.step b{font-size:42px}
.step span.detail{color:${t.muted};font-size:30px}
.step-arrow{color:${ink}}
.dd-card{${card};border-radius:28px}
.dd-head{font-size:36px;border-bottom:4px solid ${ink}}
.dd-card.bad .dd-head{background:#FF8A8A}.dd-card.good .dd-head{background:#86EFAC}
.dd-card ul{font-size:36px;font-weight:600}
.phone{border-color:${ink};box-shadow:16px 16px 0 ${ink}}
.doodle{color:${ink}}
.cta{${card};background:#fff;color:${ink}}
[data-type=closing] h2{font-size:132px!important;line-height:1.08}
[data-type=cover] h1{font-size:132px;line-height:1.06}
[data-type=cover] .sub{font-size:44px}
.teaser{background:${ink};color:#fff;transform:rotate(-3deg);font-size:40px;padding:24px 34px;box-shadow:8px 8px 0 rgba(0,0,0,.18)}
.cta p{font-size:44px}
.avatar{border:3px solid ${ink}}
.mini-avatar{border:3px solid ${ink};background:#fff}
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

/** Title text with the optional highlighted phrase wrapped in <mark>. */
function marked(text: string, highlight: string | undefined): RawHtml {
  const at = highlight ? text.indexOf(highlight) : -1;
  if (!highlight || at < 0) return html`${text}`;
  return html`${text.slice(0, at)}<mark>${highlight}</mark>${text.slice(at + highlight.length)}`;
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

function iconBox(slide: Slide, assets: SlideAssets): RawHtml | null {
  const svgMarkup = assets.icons[slide.id];
  return svgMarkup ? html`<div class="icon">${raw(svgMarkup)}</div>` : null;
}

function cover({ content }: SlideContext): RawHtml {
  const { headline, subtitle, highlight } = content.cover;
  const points = content.slides.filter((s) => NUMBERED.includes(s.type)).length;
  return html`<h1>${marked(headline, highlight)}</h1>
    <p class="sub">${subtitle}</p>
    <span class="teaser">${points > 1 ? `Swipe for all ${points}` : "Swipe"} ${ICON.arrow}</span>`;
}

const NUMBERED: Slide["type"][] = ["content", "code", "comparison", "steps", "dodont", "mockup"];

/** Point number shown on the badge: counts only "point" slides, not statements/stats/checklists. */
function pointNumber(slides: Slide[], index: number): number | null {
  if (!NUMBERED.includes(slides[index].type)) return null;
  return slides.slice(0, index + 1).filter((s) => NUMBERED.includes(s.type)).length;
}

function codeBlock(
  label: string,
  kind: "bad" | "good",
  source: string,
  highlighted: string | undefined,
): RawHtml {
  return html`<div class="code">
    <div class="code-head">
      <span class="dots"><i></i><i></i><i></i></span>
      <span class="tag ${kind}">${label}</span>
    </div>
    ${highlighted ? raw(highlighted.replace("<pre", "<pre data-check-x")) : html`<pre data-check-x>${source}</pre>`}
  </div>`;
}

function slideBody(slide: Slide, number: number | null, ctx: SlideContext): RawHtml {
  const assets = ctx.assets ?? NO_ASSETS;
  const icon = iconBox(slide, assets);
  const title = marked(slide.title, slide.highlight);
  const heading = html`<div class="heading">
    ${number === null ? null : html`<span class="num">${String(number).padStart(2, "0")}</span>`}
    <h2>${title}</h2>
  </div>`;
  const desc = slide.description ? html`<p class="desc">${slide.description}</p>` : null;

  switch (slide.type) {
    case "content":
      return html`${icon}${heading}${desc}${bulletList(slide.bullets)}${tip(slide.tip)}`;
    case "code": {
      const { before, after, explanation } = slide.code;
      const hl = assets.code[slide.id] ?? {};
      return html`${heading}${desc}
      ${before ? codeBlock(after ? "Before" : "Example", "bad", before, hl.before) : null}
      ${after ? codeBlock(before ? "After" : "Example", "good", after, hl.after) : null}
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
      return html`${icon}${heading}${desc}
        <ul class="list check">
          ${slide.bullets.map((b) => html`<li><span class="box">${ICON.check}</span><span>${b}</span></li>`)}
        </ul>
        ${tip(slide.tip)}`;
    case "statement":
      return html`<div class="statement" style="display:flex;flex-direction:column;gap:40px">
        ${icon}
        <h2>${title}</h2>
        ${desc}
      </div>`;
    case "stat":
      return html`${icon}
        <h3>${title}</h3>
        <div class="stat-value" style="font-size:${statFontSize(slide.stat.value)}px">
          <span>${slide.stat.value}</span>
        </div>
        <p class="stat-label">${slide.stat.label}</p>
        ${desc}`;
    case "steps":
      return html`${heading}${desc}
        <ol class="steps">
          ${slide.steps.map(
            (step, i) =>
              html`${i > 0 ? html`<li class="step-arrow" aria-hidden="true">${ICON.down}</li>` : null}
                <li class="step">
                  <span class="step-n">${i + 1}</span>
                  <div>
                    <b>${step.label}</b>
                    ${step.detail ? html`<span class="detail">${step.detail}</span>` : null}
                  </div>
                </li>`,
          )}
        </ol>`;
    case "dodont":
      return html`${heading}
        <div class="dd">
          <div class="dd-card bad">
            <div class="dd-head">${ICON.cross} Don't</div>
            <ul>
              ${slide.dont.map((d) => html`<li>${d}</li>`)}
            </ul>
          </div>
          <div class="dd-card good">
            <div class="dd-head">${ICON.check} Do</div>
            <ul>
              ${slide.do.map((d) => html`<li>${d}</li>`)}
            </ul>
          </div>
        </div>
        ${tip(slide.tip)}`;
    case "mockup": {
      const image = assets.images[slide.id];
      const { screenTitle, rows = [] } = slide.mockup;
      const screen = image
        ? html`<img data-check-image src="${image}" alt="" />`
        : html`<div class="screen">
            ${screenTitle ? html`<div class="screen-title">${screenTitle}</div>` : null}
            ${rows.map((r) => html`<div class="screen-row"><i>${ICON.check}</i>${r}</div>`)}
          </div>`;
      return html`<div class="mock-grid">
        <div class="mock-text">${heading}${desc}${tip(slide.tip)}</div>
        <div class="phone"><span class="notch"></span>${screen}</div>
      </div>`;
    }
    case "closing": {
      const { branding, content } = ctx;
      return html`${icon ?? ICON.squiggle}
        <h2 style="font-size:84px">${title}</h2>
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

/** Largest size at which the value still fits on one line. */
function statFontSize(value: string): number {
  return Math.min(280, Math.floor(1450 / Math.max(value.length, 1)));
}

function slideBackground(theme: Theme, index: number): string {
  if (theme.variant !== "pop" || !theme.palette?.length) return theme.bg;
  return theme.palette[index % theme.palette.length];
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
          :root{--bg:${raw(slideBackground(theme, index))}}
          ${raw(baseCss(theme))}
          ${raw(theme.variant === "pop" ? popCss(theme) : "")}
        </style>
      </head>
      <body>
        <div class="slide" data-type="${slide?.type ?? "cover"}" data-variant="${theme.variant}">
          <header class="top">
            <div class="progress">
              ${Array.from({ length: total }, (_, i) => html`<i class="${i <= index ? "on" : ""}"></i>`)}
            </div>
            <div class="meta">
              <span class="pill">${series}</span>
              <span class="count"
                >${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span
              >
            </div>
          </header>
          <main class="body" data-fit>
            ${slide ? slideBody(slide, pointNumber(content.slides, index - 1), ctx) : cover(ctx)}
          </main>
          <footer class="bottom">
            <span class="brand">
              ${branding.photo ? html`<span class="mini-avatar">${photoImg(branding.photo)}</span>` : null}
              ${branding.handle}
            </span>
            ${
              isLast
                ? html`<span>Save · Share</span>`
                : index === 0
                  ? null
                  : html`<span class="swipe">Swipe ${ICON.arrow}</span>`
            }
          </footer>
        </div>
      </body>
    </html>`;
  return doc.value;
}

/** Rough word count of what's printed on a slide, for the "too texty" warning. */
export function slideWordCount(slide: Slide): number {
  const parts: string[] = [slide.title, slide.description ?? "", slide.tip ?? ""];
  if ("bullets" in slide && slide.bullets) parts.push(...slide.bullets);
  if (slide.type === "comparison")
    slide.comparison.rows.forEach((r) => parts.push(r.left, r.right));
  if (slide.type === "steps") slide.steps.forEach((s) => parts.push(s.label, s.detail ?? ""));
  if (slide.type === "dodont") parts.push(...slide.do, ...slide.dont);
  if (slide.type === "stat") parts.push(slide.stat.label);
  if (slide.type === "code") parts.push(slide.code.explanation ?? "");
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}
