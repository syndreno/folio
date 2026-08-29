import { expect, test } from "@playwright/test";

test("creates, customizes, checks, and downloads a portable resume", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your experience/i })).toBeVisible();

  await page.getByRole("button", { name: /Create a new resume/i }).click();
  await page.getByLabel("Full name").fill("Morgan Rivera");
  await expect(page.locator(".resume-header h1").first()).toHaveText("Morgan Rivera");

  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("radio", { name: /Modern ATS/i }).click();
  await expect(page.locator(".resume-page.template-modern").first()).toBeVisible();

  await page.getByRole("button", { name: "ATS", exact: true }).click();
  await expect(page.getByText("ATS Readiness", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Word DOCX");
  await expect(page.getByRole("dialog")).toContainText("PNG pages");
  await page.getByRole("button", { name: "Close", exact: true }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .md", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("morgan-rivera-resume.md");
});
