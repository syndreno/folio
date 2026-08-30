import { readFile } from "node:fs/promises";
import { expect, test, type Download, type Page } from "@playwright/test";
import JSZip from "jszip";
import { TEMPLATE_DEFINITIONS } from "../src/features/templates/registry";

type AuditedImageFormat = "png" | "jpeg";

function readPngDimensions(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function readJpegDimensions(bytes: Buffer): { width: number; height: number } {
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1] ?? 0;
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const segmentLength = bytes.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]
      .includes(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }
  throw new Error("JPEG dimensions were not found");
}

function verifyImageBytes(bytes: Buffer, format: AuditedImageFormat, templateId: string) {
  expect(bytes.length, templateId).toBeGreaterThan(10_000);
  const dimensions = format === "png"
    ? readPngDimensions(bytes)
    : readJpegDimensions(bytes);
  expect(dimensions.width, templateId).toBeGreaterThanOrEqual(1_400);
  expect(dimensions.height, templateId).toBeGreaterThanOrEqual(1_900);
  expect(dimensions.width / dimensions.height, templateId).toBeCloseTo(210 / 297, 1);
}

async function verifyImageDownload(
  download: Download,
  format: AuditedImageFormat,
  expectedPageCount: number,
  templateId: string,
) {
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error(`${templateId}: browser did not retain the ${format} download`);
  const bytes = await readFile(downloadPath);
  if (download.suggestedFilename().endsWith(".zip")) {
    const archive = await JSZip.loadAsync(bytes);
    const extension = format === "jpeg" ? ".jpg" : ".png";
    const imageFiles = Object.values(archive.files).filter(
      (file) => !file.dir && file.name.endsWith(extension),
    );
    expect(imageFiles, templateId).toHaveLength(expectedPageCount);
    for (const imageFile of imageFiles) {
      verifyImageBytes(
        Buffer.from(await imageFile.async("uint8array")),
        format,
        templateId,
      );
    }
    return;
  }

  expect(expectedPageCount, templateId).toBe(1);
  expect(download.suggestedFilename(), templateId).toMatch(
    format === "png" ? /-page-1\.png$/ : /-page-1\.jpg$/,
  );
  verifyImageBytes(bytes, format, templateId);
}

async function downloadImage(page: Page, format: AuditedImageFormat): Promise<Download> {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("button", {
    name: format === "png" ? /PNG pages/i : /JPEG pages/i,
  }).click();
  return downloadPromise;
}

test("audits live preview, PNG, and JPEG for every template", async ({ page }) => {
  test.skip(
    process.env.FULL_TEMPLATE_AUDIT !== "1",
    "Run with FULL_TEMPLATE_AUDIT=1 for the full 58-template image matrix.",
  );
  test.setTimeout(20 * 60_000);

  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Create a new resume/i }).click();
  await page.getByRole("button", { name: "Design", exact: true }).click();

  for (const [index, template] of TEMPLATE_DEFINITIONS.entries()) {
    console.log(`[template audit ${index + 1}/${TEMPLATE_DEFINITIONS.length}] ${template.id}`);
    const previewPages = page.locator(
      `.resume-page.template-${template.id}:not(.resume-measurement)`,
    );
    await expect(previewPages.first(), template.id).toBeVisible();
    await expect(previewPages.first(), template.id).toHaveAttribute(
      "data-template-layout",
      template.layout,
    );
    await page.waitForTimeout(100);

    const pageCount = await previewPages.count();
    expect(pageCount, template.id).toBeGreaterThanOrEqual(1);
    const overflow = await previewPages.evaluateAll((resumePages) => resumePages.flatMap(
      (resumePage, pageIndex) => {
        const bounds = resumePage.getBoundingClientRect();
        const overflowingBlocks = Array.from(
          resumePage.querySelectorAll<HTMLElement>(".resume-preview-block"),
        ).filter((block) => {
          const blockBounds = block.getBoundingClientRect();
          return blockBounds.right > bounds.right + 1
            || blockBounds.bottom > bounds.bottom + 1
            || blockBounds.left < bounds.left - 1;
        });
        return overflowingBlocks.map(
          (block) => `page ${pageIndex + 1}: ${block.textContent?.slice(0, 48) ?? "unknown"}`,
        );
      },
    ));
    expect(overflow, template.id).toEqual([]);

    const pngDownload = await downloadImage(page, "png");
    await verifyImageDownload(pngDownload, "png", pageCount, template.id);
    const jpegDownload = await downloadImage(page, "jpeg");
    await verifyImageDownload(jpegDownload, "jpeg", pageCount, template.id);

    if (index < TEMPLATE_DEFINITIONS.length - 1) {
      await page.getByRole("button", { name: "Use next template" }).click();
      await expect(
        page.locator(`.resume-page.template-${TEMPLATE_DEFINITIONS[index + 1]?.id}`).first(),
      ).toBeVisible();
    }
  }

  expect(browserErrors).toEqual([]);
});
