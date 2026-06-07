import { expect, test } from "#tests/playwright-utils.ts";

const year = new Date().getFullYear().toString();

test.beforeEach(async ({ page, navigate, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await navigate("/allocate/:year", { year });
  await page.getByRole("button", { name: /see how your priorities compare/i }).click();
  await page.waitForURL(/\/juxtapose$/);
});

test("toggles the allocation's publish status and the share panel", async ({ page }) => {
  const toggleButton = page.getByRole("button", { name: /^(Published|Unpublished)$/, exact: true });
  const sharePrompt = page.getByText("Share and see where you agree.");

  await expect(toggleButton).toHaveText("Unpublished");
  await expect(sharePrompt).toBeHidden();

  await toggleButton.click();

  await expect(toggleButton).toHaveText("Published");
  await expect(sharePrompt).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveValue(/\/s\/[^/]+$/);

  await toggleButton.click();

  await expect(toggleButton).toHaveText("Unpublished");
  await expect(sharePrompt).toBeHidden();
});

test("copies the share link to the clipboard", async ({ page }) => {
  const toggleButton = page.getByRole("button", { name: /^(Published|Unpublished)$/, exact: true });

  await toggleButton.click();
  await expect(toggleButton).toHaveText("Published");

  const shareInput = page.getByRole("textbox");
  const shareUrl = await shareInput.inputValue();
  expect(shareUrl).toMatch(/\/s\/[^/]+$/);

  await shareInput.click();

  await expect(shareInput).toHaveAttribute("title", "Copied!");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(shareUrl);
});
