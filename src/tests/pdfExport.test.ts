// @vitest-environment node

import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { createBlankResume, createEmptyItem } from "../domain/resume.defaults";
import { buildResumePdfBlob } from "../features/export/pdf/exportResumeToPdf";
import { createPdfTemplateStyles } from "../features/export/pdf/pdfTemplateStyles";

describe("ATS PDF export", () => {
  it("embeds selected Font Awesome contact icons as vector paths", async () => {
    const withIcons = createBlankResume();
    withIcons.personal.fullName = "Taylor Morgan";
    const withoutIcons = structuredClone(withIcons);
    withoutIcons.design.showContactIcons = false;

    const countVectorPaths = async (resume: typeof withIcons) => {
      const bytes = new Uint8Array(await (await buildResumePdfBlob(resume)).arrayBuffer());
      const loadingTask = getDocument({ data: bytes, useSystemFonts: true });
      const document = await loadingTask.promise;
      const page = await document.getPage(1);
      const operators = await page.getOperatorList();
      const vectorPathCount = operators.fnArray.filter(
        (operator) => operator === OPS.constructPath,
      ).length;
      const text = await page.getTextContent();
      const extractedText = text.items
        .filter((item): item is typeof item & { str: string } => "str" in item)
        .map((item) => item.str)
        .join(" ");
      await loadingTask.destroy();
      return { extractedText, vectorPathCount };
    };

    const iconResult = await countVectorPaths(withIcons);
    const textOnlyResult = await countVectorPaths(withoutIcons);

    expect(iconResult.vectorPathCount).toBeGreaterThan(textOnlyResult.vectorPathCount);
    expect(iconResult.extractedText).toContain("you@example.com");
    expect(iconResult.extractedText).toContain("+00 00000 00000");
  }, 20_000);

  it("maps each selected template to its live-preview PDF styling", () => {
    const classic = createBlankResume();
    const classicStyles = createPdfTemplateStyles(classic);
    expect(classicStyles.header).toMatchObject({ borderBottomWidth: 1.5 });
    expect(classicStyles.name).toMatchObject({ fontSize: 25 });
    expect(classicStyles.simpleItem).toHaveProperty("backgroundColor");

    const modern = createBlankResume();
    modern.design.templateId = "modern";
    const modernStyles = createPdfTemplateStyles(modern);
    expect(modernStyles.header).toMatchObject({ borderTopWidth: 3, paddingLeft: 10.5 });
    expect(modernStyles.header).toHaveProperty("backgroundColor");
    expect(modernStyles.sectionTitle).toMatchObject({ borderLeftWidth: 2.25, fontSize: 9.5 });
    expect(modernStyles.simpleItem).toMatchObject({ borderWidth: 0.75, borderRadius: 7.5 });

    const professional = createBlankResume();
    professional.design.templateId = "professional";
    professional.design.showPhoto = true;
    professional.personal.photo =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const professionalStyles = createPdfTemplateStyles(professional);
    expect(professionalStyles.header).toMatchObject({ borderTopWidth: 2.25, paddingLeft: 10.5 });
    expect(professionalStyles.header.minHeight).toBeCloseTo(98.12, 1);
    expect(professionalStyles.header).toHaveProperty("backgroundColor");
    expect(professionalStyles.photoFrame).toMatchObject({ borderWidth: 1.5 });
  });

  it("renders the Professional photo treatment while keeping resume text selectable", async () => {
    const resume = createBlankResume();
    resume.design.templateId = "professional";
    resume.design.showPhoto = true;
    resume.design.photoShape = "rounded";
    resume.design.photoZoom = 1.2;
    resume.design.photoPositionX = 35;
    resume.design.photoPositionY = 60;
    resume.personal.fullName = "Jamie Chen";
    resume.personal.photo =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    const bytes = new Uint8Array(await (await buildResumePdfBlob(resume)).arrayBuffer());
    const loadingTask = getDocument({ data: bytes, useSystemFonts: true });
    const document = await loadingTask.promise;
    const text = await (await document.getPage(1)).getTextContent();
    const extractedText = text.items
      .filter((item): item is typeof item & { str: string } => "str" in item)
      .map((item) => item.str)
      .join(" ");

    expect(extractedText).toContain("Jamie Chen");
    expect(extractedText).toContain("PROFESSIONAL SUMMARY");
    await loadingTask.destroy();
  }, 15_000);

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
    expect(extractedText).not.toMatch(/Page \d+ of \d+/);

    await loadingTask.destroy();
  }, 30_000);
});
