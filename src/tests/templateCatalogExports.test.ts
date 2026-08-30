// @vitest-environment node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import JSZip from "jszip";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import type { ResumeDocument } from "../domain/resume.types";
import { buildResumeDocxBlob } from "../features/export/docx/exportResumeToDocx";
import { buildResumePdfBlob } from "../features/export/pdf/exportResumeToPdf";
import { TEMPLATE_DEFINITIONS } from "../features/templates/registry";
import { parseResumeMarkdown } from "../parsers/markdown/parseResumeMarkdown";
import { serializeResumeMarkdown } from "../serializers/markdown/serializeResumeMarkdown";

async function createCatalogAuditResume(): Promise<ResumeDocument> {
  const markdown = await readFile(
    new URL("../../public/examples/example-resume.md", import.meta.url),
    "utf8",
  );
  return parseResumeMarkdown(markdown).resume;
}

function applyTemplatePreset(
  baseResume: ResumeDocument,
  template: (typeof TEMPLATE_DEFINITIONS)[number],
): ResumeDocument {
  const resume = structuredClone(baseResume);
  resume.personal.fullName = `${template.name} Audit Candidate`;
  resume.design = {
    ...resume.design,
    templateId: template.id,
    ...template.visualPreset,
  };
  return resume;
}

describe("complete template catalog exports", () => {
  it("round-trips every complete template resume through portable Markdown", async () => {
    const baseResume = await createCatalogAuditResume();
    TEMPLATE_DEFINITIONS.forEach((template) => {
      const resume = applyTemplatePreset(baseResume, template);
      const restored = parseResumeMarkdown(serializeResumeMarkdown(resume));
      expect(restored.resume.design.templateId).toBe(template.id);
      expect(restored.resume.design.accentColor).toBe(template.visualPreset.accentColor);
      expect(restored.resume.design.fontFamily).toBe(template.visualPreset.fontFamily);
      expect(restored.resume.personal.fullName).toBe(`${template.name} Audit Candidate`);
      expect(restored.resume.sections.map((section) => section.title)).toEqual(
        resume.sections.map((section) => section.title),
      );
      expect(restored.resume.sections.flatMap((section) => section.items).length).toBe(
        resume.sections.flatMap((section) => section.items).length,
      );
    });
  });

  it("generates a complete editable DOCX for every template configuration", async () => {
    const baseResume = await createCatalogAuditResume();
    const wordAuditDirectory = process.env.WRITE_WORD_AUDIT === "1"
      ? new URL("../../test-results/word-audit/", import.meta.url)
      : null;
    if (wordAuditDirectory) await mkdir(wordAuditDirectory, { recursive: true });
    for (const template of TEMPLATE_DEFINITIONS) {
      const resume = applyTemplatePreset(baseResume, template);
      const blob = await buildResumeDocxBlob(resume);
      expect(blob.type, template.id).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      expect(blob.size, template.id).toBeGreaterThan(8_000);
      const blobBytes = new Uint8Array(await blob.arrayBuffer());
      if (wordAuditDirectory) {
        await writeFile(new URL(`${template.id}.docx`, wordAuditDirectory), blobBytes);
      }
      const archive = await JSZip.loadAsync(blobBytes);
      const documentXml = await archive.file("word/document.xml")?.async("string");
      const relationshipsXml = await archive
        .file("word/_rels/document.xml.rels")
        ?.async("string");
      expect(documentXml, template.id).toContain(`${template.name} Audit Candidate`);
      expect(documentXml, template.id).toContain("Professional Summary");
      expect(documentXml, template.id).toContain("Northstar Technologies");
      expect(documentXml, template.id).toContain("Operations Dashboard");
      expect(documentXml, template.id).toContain("Microsoft Certified");
      expect(documentXml, template.id).toContain("<w:numPr>");
      expect(documentXml, template.id).not.toMatch(/>\s*(?:undefined|NaN)\s*</i);
      expect(documentXml, template.id).not.toContain("<script");
      expect(relationshipsXml, template.id).toContain("relationships/hyperlink");
      expect(archive.file("word/numbering.xml"), template.id).not.toBeNull();
      expect(archive.file("[Content_Types].xml"), template.id).not.toBeNull();
      if (template.skillStyle === "chips" || template.skillStyle === "outline") {
        expect(documentXml, template.id).toContain('a:prstGeom prst="roundRect"');
        expect(documentXml, template.id).toContain("<w:txbxContent>");
        const skillShapeIds = [...(documentXml?.matchAll(
          /<wp:docPr id="(\d+)" name="Skill /g,
        ) ?? [])].map((match) => match[1]);
        expect(new Set(skillShapeIds).size, template.id).toBe(skillShapeIds.length);
      }
      if (template.supportsTwoColumns) {
        expect(documentXml, template.id).toContain("<w:tbl>");
      }
    }
  }, 120_000);

  it("generates complete selectable PDF output for every template configuration", async () => {
    const baseResume = await createCatalogAuditResume();
    const testedLayouts = new Set<string>();
    for (const template of TEMPLATE_DEFINITIONS) {
      testedLayouts.add(template.layout);
      const resume = applyTemplatePreset(baseResume, template);
      const blob = await buildResumePdfBlob(resume);
      expect(blob.size, template.id).toBeGreaterThan(1_000);
      expect(blob.type, template.id).toBe("application/pdf");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const loadingTask = getDocument({ data: bytes, useSystemFonts: true });
      const document = await loadingTask.promise;
      expect(document.numPages, template.id).toBeGreaterThanOrEqual(1);
      const extractedPages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const textContent = await page.getTextContent();
        extractedPages.push(textContent.items
          .filter((item): item is typeof item & { str: string } => "str" in item)
          .map((item) => item.str)
          .join(" "));
      }
      const extractedText = extractedPages.join(" ");
      const normalizedText = extractedText.toLocaleUpperCase("en");
      expect(extractedText, template.id).toContain(`${template.name} Audit Candidate`);
      expect(normalizedText, template.id).toContain("PROFESSIONAL SUMMARY");
      expect(normalizedText, template.id).toContain("NORTHSTAR TECHNOLOGIES");
      expect(normalizedText, template.id).toContain("OPERATIONS DASHBOARD");
      expect(normalizedText, template.id).toContain("WEB ACCESSIBILITY");
      expect(extractedText, template.id).not.toMatch(/undefined|NaN/);
      await loadingTask.destroy();
    }
    expect(testedLayouts.size).toBe(19);
  }, 180_000);
});
