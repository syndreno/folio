// @vitest-environment node

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { createBlankResume, createEmptyItem } from "../domain/resume.defaults";
import { buildResumePdfBlob } from "../features/export/pdf/exportResumeToPdf";

describe("ATS PDF export", () => {
  it("creates selectable text across two or more pages without dropping content", async () => {
    const resume = createBlankResume();
    resume.design.templateId = "modern";
    resume.personal.fullName = "Jordan Lee";
    resume.personal.professionalTitle = "Principal Platform Engineer";
    const experience = resume.sections.find((section) => section.type === "experience");
    if (!experience) throw new Error("Experience fixture is missing");

    experience.items = Array.from({ length: 18 }, (_, index) => ({
      ...createEmptyItem(),
      title: `Platform Engineer Role ${index + 1}`,
      subtitle: `Example Company ${index + 1}`,
      meta: `January ${2005 + index} - December ${2005 + index} | Remote`,
      description: "Built reliable services and collaborated with product and operations teams.",
      bullets: [
        `Improved service reliability by ${20 + index}% through monitoring and automated recovery.`,
        `Supported more than ${(index + 1) * 10000} monthly requests with documented operational practices.`,
        "Mentored engineers and created reusable implementation guidance for multiple teams.",
      ],
    }));

    const blob = await buildResumePdfBlob(resume);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const loadingTask = getDocument({ data: bytes, useSystemFonts: true });
    const document = await loadingTask.promise;
    const extractedPages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const text = await page.getTextContent();
      extractedPages.push(
        text.items
          .filter((item): item is typeof item & { str: string } => "str" in item)
          .map((item) => item.str)
          .join(" "),
      );
    }

    const extractedText = extractedPages.join(" ");
    expect(document.numPages).toBeGreaterThanOrEqual(2);
    expect(extractedText).toContain("Jordan Lee");
    expect(extractedText).toContain("EXPERIENCE");
    expect(extractedText).toContain("Platform Engineer Role 1");
    expect(extractedText).toContain("Platform Engineer Role 18");
    expect(extractedPages[0]).toContain("Jordan Lee");
    expect(extractedPages.at(-1)).toContain("Platform Engineer Role 18");

    await loadingTask.destroy();
  }, 30_000);
});
