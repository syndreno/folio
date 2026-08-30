// @vitest-environment node

import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { TEMPLATE_CATALOG } from "../constants/resumeTemplates";
import { createBlankResume } from "../domain/resume.defaults";
import { buildResumeDocxBlob } from "../features/export/docx/exportResumeToDocx";
import { buildResumePdfBlob } from "../features/export/pdf/exportResumeToPdf";
import { parseResumeMarkdown } from "../parsers/markdown/parseResumeMarkdown";
import { serializeResumeMarkdown } from "../serializers/markdown/serializeResumeMarkdown";

describe("complete template catalog exports", () => {
  it("round-trips every template ID through portable Markdown", () => {
    TEMPLATE_CATALOG.forEach((template) => {
      const resume = createBlankResume();
      resume.design.templateId = template.id;
      const restored = parseResumeMarkdown(serializeResumeMarkdown(resume));
      expect(restored.resume.design.templateId).toBe(template.id);
    });
  });

  it("generates an editable DOCX for every template configuration", async () => {
    for (const template of TEMPLATE_CATALOG) {
      const resume = createBlankResume();
      resume.design.templateId = template.id;
      resume.personal.fullName = `${template.name} Candidate`;
      const blob = await buildResumeDocxBlob(resume);
      const archive = await JSZip.loadAsync(await blob.arrayBuffer());
      const documentXml = await archive.file("word/document.xml")?.async("string");
      expect(documentXml, template.id).toContain(`${template.name} Candidate`);
      expect(documentXml, template.id).toContain("Professional Summary");
    }
  }, 60_000);

  it("generates selectable PDF output for all nine layout systems", async () => {
    const testedLayouts = new Set<string>();
    for (const template of TEMPLATE_CATALOG) {
      if (testedLayouts.has(template.layout)) continue;
      testedLayouts.add(template.layout);
      const resume = createBlankResume();
      resume.design.templateId = template.id;
      resume.design.showContactIcons = false;
      resume.personal.fullName = `${template.name} PDF Candidate`;
      const blob = await buildResumePdfBlob(resume);
      expect(blob.size, template.id).toBeGreaterThan(1_000);
      expect(blob.type, template.id).toBe("application/pdf");
    }
    expect(testedLayouts.size).toBe(9);
  }, 60_000);
});
