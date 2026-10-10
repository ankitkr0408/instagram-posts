/** Escaped-by-default HTML building. Interpolated values are always text unless wrapped in `raw()`. */

const RAW = Symbol("raw");
export type RawHtml = { [RAW]: true; value: string };

export function raw(value: string): RawHtml {
  return { [RAW]: true, value };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type Value = string | number | RawHtml | null | undefined | false | Value[];

function render(value: Value): string {
  if (value === null || value === undefined || value === false) return "";
  if (Array.isArray(value)) return value.map(render).join("");
  if (typeof value === "object") return value.value;
  return escapeHtml(String(value));
}

export function html(strings: TemplateStringsArray, ...values: Value[]): RawHtml {
  let out = strings[0];
  values.forEach((value, i) => {
    out += render(value) + strings[i + 1];
  });
  return raw(out);
}
