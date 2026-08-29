import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

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

test("exports the selected premium template with selectable text and vector contact icons", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.getByRole("button", { name: /Create a new resume/i }).click();
  await page.getByLabel("Full name").fill("Riley Thompson");
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("radio", { name: /Modern ATS/i }).click();
  await page.getByRole("button", { name: "Contemporary" }).click();
  await page.getByRole("button", { name: "Email icon picker" }).click();
  await page.getByRole("searchbox", { name: "Search Email icons" }).fill("paper plane");
  await page.getByRole("option", { name: "Use Paper Plane icon for Email", exact: true }).click();
  await expect(page.locator(".resume-page.template-modern").first()).toBeVisible();
  await expect(page.locator(".resume-contact .contact-icon").first()).toBeVisible();

  await page.getByRole("button", { name: "Export", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /ATS PDF/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("riley-thompson-resume.pdf");

  const downloadPath = await download.path();
  if (!downloadPath) throw new Error("Playwright did not retain the PDF download");
  const bytes = new Uint8Array(await readFile(downloadPath));
  const loadingTask = getDocument({ data: bytes, useSystemFonts: true });
  const document = await loadingTask.promise;
  const firstPage = await document.getPage(1);
  const text = await firstPage.getTextContent();
  const extractedText = text.items
    .filter((item): item is typeof item & { str: string } => "str" in item)
    .map((item) => item.str)
    .join(" ");
  const operators = await firstPage.getOperatorList();

  expect(extractedText).toContain("Riley Thompson");
  expect(extractedText).toContain("you@example.com");
  expect(operators.fnArray.filter((operator) => operator === OPS.constructPath).length)
    .toBeGreaterThan(3);
  await loadingTask.destroy();
});
