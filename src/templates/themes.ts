export type Theme = {
  bg: string;
  text: string;
  muted: string;
  card: string;
  border: string;
  green: string;
  /** Text color on top of `green`. */
  onGreen: string;
  greenSoft: string;
  yellow: string;
  pink: string;
  blue: string;
  codeBg: string;
  codeText: string;
};

export const TEMPLATES = {
  "ship-it-right": {
    label: "Ship It Right (light)",
    version: "1.0.0",
    theme: {
      bg: "#FAF6EE",
      text: "#141414",
      muted: "#5E5A52",
      card: "#FFFFFF",
      border: "#E6DFD2",
      green: "#1F9D55",
      onGreen: "#FFFFFF",
      greenSoft: "#DDF3E4",
      yellow: "#FFE9A8",
      pink: "#FFD6E0",
      blue: "#D5E8FF",
      codeBg: "#16181D",
      codeText: "#E8EAED",
    },
  },
  "night-shift": {
    label: "Night Shift (dark)",
    version: "1.0.0",
    theme: {
      bg: "#121411",
      text: "#F3F1EA",
      muted: "#A7A399",
      card: "#1D201C",
      border: "#2F332D",
      green: "#4ADE80",
      onGreen: "#0B1A10",
      greenSoft: "#1E3A28",
      yellow: "#4A3F17",
      pink: "#4A2330",
      blue: "#1E3150",
      codeBg: "#0A0B0A",
      codeText: "#E8EAED",
    },
  },
} satisfies Record<string, { label: string; version: string; theme: Theme }>;

export type TemplateName = keyof typeof TEMPLATES;
export const TEMPLATE_NAMES = Object.keys(TEMPLATES) as [TemplateName, ...TemplateName[]];
