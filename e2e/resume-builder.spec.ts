import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import JSZip from "jszip";

test("guides users from a PDF or existing Markdown file into the builder", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Guide", exact: true }).click();

  await expect(page.getByRole("heading", { name: /Bring your resume into Folio/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Improve an existing Folio .md file" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Convert an existing resume PDF" })).toBeVisible();
  await expect(page.getByText("An external AI service may not.")).toBeVisible();
  await expect(page.locator(".guide-prompt-card pre")).toHaveCount(2);
  await expect(page.getByRole("link", { name: /Download .md template/i })).toHaveAttribute("download", "");
  await expect(page.getByRole("button", { name: /Import finished .md/i })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: /Bring your resume into Folio/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.getByRole("heading", { name: /Your experience/i })).toBeVisible();
});

test("creates, customizes, checks, and downloads a portable resume", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your experience/i })).toBeVisible();

  await page.getByRole("button", { name: /Create a new resume/i }).click();
  await page.getByLabel("Full name").fill("Morgan Rivera");
  await expect(page.locator(".resume-header h1").first()).toHaveText("Morgan Rivera");
  const firstInlineSkill = page.locator(
    '.resume-page[data-skill-style="inline"] .simple-entry-list .simple-pill',
  ).first();
  await expect(firstInlineSkill).toBeVisible();
  expect(await firstInlineSkill.evaluate(
    (element) => window.getComputedStyle(element, "::before").content,
  )).toContain("•");

  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("button", { name: /Browse all 58 templates/i }).click();
  await page.getByRole("button", { name: "Use Modern ATS", exact: true }).click();
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
  await page.getByRole("button", { name: /Browse all 58 templates/i }).click();
  await page.getByRole("button", { name: "Use Boardroom", exact: true }).click();
  await page.getByRole("button", { name: "Contemporary" }).click();
  await page.getByRole("button", { name: "Email icon picker" }).click();
  await page.getByRole("searchbox", { name: "Search Email icons" }).fill("paper plane");
  await page.getByRole("option", { name: "Use Paper Plane icon for Email", exact: true }).click();
  await expect(page.locator(".resume-page.template-boardroom").first()).toHaveAttribute(
    "data-template-layout",
    "statement",
  );
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

test("exports a premium visual layout to DOCX, PNG, and JPEG", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.getByRole("button", { name: /Create a new resume/i }).click();
  await page.getByLabel("Full name").fill("Casey Stone");
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("button", { name: /Browse all 58 templates/i }).click();
  await page.getByRole("button", { name: "Use Aperture", exact: true }).click();
  await expect(page.locator(".resume-page.template-aperture").first()).toHaveAttribute(
    "data-template-layout",
    "showcase",
  );

  const exportFormat = async (buttonName: RegExp, expectedFileName: string) => {
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.getByRole("button", { name: buttonName }).click();
    const download = await downloadPromise.catch(async (error: unknown) => {
      const status = await page.locator(".message-bar strong").textContent({ timeout: 1_000 })
        .catch(() => "No status message");
      throw new Error(`${error instanceof Error ? error.message : String(error)} Status: ${status}`);
    });
    expect(download.suggestedFilename()).toBe(expectedFileName);
    return download;
  };

  const docxDownload = await exportFormat(/Word DOCX/i, "casey-stone-resume.docx");
  const docxPath = await docxDownload.path();
  if (!docxPath) throw new Error("Playwright did not retain the DOCX download");
  const docxArchive = await JSZip.loadAsync(await readFile(docxPath));
  const documentXml = await docxArchive.file("word/document.xml")?.async("string");
  expect(documentXml).toContain("Casey Stone");
  expect(documentXml).toContain("<w:tbl>");
  await exportFormat(/PNG pages/i, "casey-stone-resume-page-1.png");
  await exportFormat(/JPEG pages/i, "casey-stone-resume-page-1.jpg");
});
