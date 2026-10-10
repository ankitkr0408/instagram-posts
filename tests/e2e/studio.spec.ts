import { expect, test, type Page } from "@playwright/test";

async function renderDraft(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("button", { name }).click();
  await expect(page.getByRole("status")).toContainText("Valid:");
  await page.getByRole("button", { name: "Render carousel" }).click();
}

test("render a draft, edit, rerender, download and reopen", async ({ page }) => {
  await renderDraft(page, "play-store-5-things.json");
  await page.waitForURL(/\/projects\//);
  const projectUrl = page.url();

  const preview = page.getByRole("region", { name: "Preview" });
  await expect(preview.getByRole("img")).toHaveCount(8);
  await expect(page.getByText("Export (render v1)")).toBeVisible();

  const cover = page.getByRole("region", { name: "Cover" });
  await cover.getByLabel("Headline").fill("5 checks before your first Play Store release");
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
  await page.getByRole("link", { name: /Before publishing on the Play Store/ }).click();
  await expect(page).toHaveURL(projectUrl);
  await expect(page.getByRole("region", { name: "Cover" }).getByLabel("Headline")).toHaveValue(
    "5 checks before your first Play Store release",
  );
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
  await renderDraft(page, "play-store-5-things-dark.json");
  await page.waitForURL(/\/projects\//);
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Play Store launch: 5 things people forget/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "play-store-5-things-dark.json" }).click();
  await expect(page.getByRole("status")).toContainText("already made a carousel");
  await page.getByRole("button", { name: "Render carousel" }).click();
  await expect(page.getByRole("status")).toContainText("Rendering anyway");
  await page.getByRole("button", { name: "Render carousel" }).click();
  await page.waitForURL(/\/projects\//);
});
