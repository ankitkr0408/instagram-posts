import { expect, test, type Page } from "@playwright/test";
import { PROMPT_EXAMPLE } from "../../src/lib/prompt/carousel-prompt";

async function render(page: Page) {
  await expect(page.getByRole("status")).toContainText("Valid:");
  await page.getByRole("button", { name: "Render carousel" }).click();
  await page.waitForURL(/\/projects\//);
}

test("render a draft, edit, rerender, download and reopen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "play-store-pop.json" }).click();
  await render(page);
  const projectUrl = page.url();

  const preview = page.getByRole("region", { name: "Preview" });
  await expect(preview.getByRole("img")).toHaveCount(10);
  await expect(page.getByText("Export (render v1)")).toBeVisible();

  const cover = page.getByRole("region", { name: "Cover" });
  await cover.getByLabel("Headline").fill("Wait before you hit Publish");
  await cover.getByLabel("Highlight words").fill("Publish");
  await expect(page.getByText("Preview shows the last render")).toBeVisible();
  await page.getByRole("button", { name: "Save & rerender" }).click();
  await expect(page.getByText("Export (render v2)")).toBeVisible();

  // Validation blocks rerendering text that is too long.
  await cover.getByLabel("Headline").fill("x".repeat(90));
  await expect(page.getByText("Fix before rerendering")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save & rerender" })).toBeDisabled();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download ZIP" }).click();
  expect((await download).suggestedFilename()).toMatch(/carousel\.zip$/);

  await page.goto("/");
  await page.getByRole("link", { name: /Play Store launch/ }).click();
  await expect(page).toHaveURL(projectUrl);
  await expect(page.getByRole("region", { name: "Cover" }).getByLabel("Headline")).toHaveValue(
    "Wait before you hit Publish",
  );
});

test("copy a prompt for Claude, paste the reply (with code fences) and render", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByLabel("Topic").fill("5 Git habits that save hours");
  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.getByRole("button", { name: "Copied ✓" })).toBeVisible();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain('"5 Git habits that save hours"');
  expect(prompt).toContain("ONLY a JSON object");

  const reply = { ...PROMPT_EXAMPLE, topic: "Git habits (pasted reply)" };
  await page
    .getByLabel("Carousel JSON")
    .fill(`Here you go:\n\`\`\`json\n${JSON.stringify(reply, null, 2)}\n\`\`\``);
  await render(page);
  await expect(page.getByRole("region", { name: "Preview" }).getByRole("img")).toHaveCount(7);
});

test("pasted JSON is validated before rendering", async ({ page }) => {
  await page.goto("/");
  const box = page.getByLabel("Carousel JSON");
  await box.fill("{ not json");
  await expect(page.getByRole("status")).toContainText("Not valid JSON");
  await expect(page.getByRole("button", { name: "Render carousel" })).toBeDisabled();

  await box.fill(JSON.stringify({ content: { seriesName: "x" } }));
  await expect(page.getByRole("status")).toContainText("content.cover");
  await expect(page.getByRole("button", { name: "Render carousel" })).toBeDisabled();
});

test("warns about duplicate topics but allows reuse", async ({ page }) => {
  const json = JSON.stringify({ ...PROMPT_EXAMPLE, topic: "Duplicate topic check" });
  await page.goto("/");
  await page.getByLabel("Carousel JSON").fill(json);
  await render(page);

  await page.goto("/");
  await page.getByLabel("Carousel JSON").fill(json);
  await expect(page.getByRole("status")).toContainText("already made a carousel");
  await page.getByRole("button", { name: "Render carousel" }).click();
  await expect(page.getByRole("status")).toContainText("Rendering anyway");
  await page.getByRole("button", { name: "Render carousel" }).click();
  await page.waitForURL(/\/projects\//);
});
