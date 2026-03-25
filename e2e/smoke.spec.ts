import { test, expect } from "@playwright/test";

test("page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /outside ir35/i })).toBeVisible();
});
