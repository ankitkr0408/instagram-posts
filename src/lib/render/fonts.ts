import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

const FONTS = [
  { family: "Space Grotesk", pkg: "space-grotesk", weights: [500, 700] },
  { family: "Inter", pkg: "inter", weights: [400, 500, 600, 700] },
  { family: "JetBrains Mono", pkg: "jetbrains-mono", weights: [400, 600] },
];

let cached: string | undefined;

/** Inline @font-face rules so the renderer never needs the network. */
export function fontFaceCss(): string {
  if (cached) return cached;
  const root = path.join(process.cwd(), "node_modules", "@fontsource");
  cached = FONTS.flatMap(({ family, pkg, weights }) =>
    weights.map((weight) => {
      const file = path.join(root, pkg, "files", `${pkg}-latin-${weight}-normal.woff2`);
      const data = readFileSync(file).toString("base64");
      return `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${data}) format("woff2");}`;
    }),
  ).join("\n");
  return cached;
}
