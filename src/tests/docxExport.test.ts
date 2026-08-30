// @vitest-environment node

import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createBlankResume, createEmptyItem } from "../domain/resume.defaults";
import { buildResumeDocxBlob } from "../features/export/docx/exportResumeToDocx";

describe("DOCX export", () => {
  it("creates editable Word text with headings, bullets, and links", async () => {
    const resume = createBlankResume();
    resume.personal.fullName = "Taylor Morgan";
    resume.personal.professionalTitle = "Platform Engineer";
    resume.personal.website = "https://example.com/portfolio";
    const experience = resume.sections.find((section) => section.type === "experience");
    if (!experience) throw new Error("Experience fixture is missing");
    experience.items = [{
      ...createEmptyItem(),
      title: "Senior Engineer",
      subtitle: "Example Systems",
      meta: "Jan 2022 - Present",
      bullets: ["Improved release reliability by 40%.", "Mentored five engineers."],
    }];

    const blob = await buildResumeDocxBlob(resume);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const documentXml = await zip.file("word/document.xml")?.async("string");
    const relationshipsXml = await zip.file("word/_rels/document.xml.rels")?.async("string");

    expect(blob.type).toContain("wordprocessingml");
    expect(documentXml).toContain("Taylor Morgan");
    expect(documentXml).toContain("Experience");
    expect(documentXml).toContain("Improved release reliability by 40%.");
    expect(documentXml).toContain("w:numPr");
    expect(relationshipsXml).toContain("https://example.com/portfolio");
  });

  it("uses the selected Modern template instead of Classic styling", async () => {
    const resume = createBlankResume();
    resume.design.templateId = "modern";
    resume.design.accentColor = "#2F6FED";
    resume.design.paperColor = "#F7F9FC";
    resume.personal.professionalTitle = "Design Engineer";

    const zip = await JSZip.loadAsync(await (await buildResumeDocxBlob(resume)).arrayBuffer());
    const documentXml = await zip.file("word/document.xml")?.async("string");
    const stylesXml = await zip.file("word/styles.xml")?.async("string");

    expect(documentXml).toContain("DESIGN ENGINEER");
    expect(documentXml).toContain("w:left");
    expect(documentXml).toContain("w:top");
    expect(documentXml).toContain('w:background w:color="F7F9FC"');
    expect(stylesXml).toContain('w:color w:val="2F6FED"');
  });

  it("starts inline skill lists with a bullet marker", async () => {
    const resume = createBlankResume();
    resume.design.templateId = "classic";
    const skills = resume.sections.find((section) => section.type === "skills");
    if (!skills) throw new Error("Skills fixture is missing");
    skills.items = [{ ...createEmptyItem(), title: "TypeScript" }];

    const zip = await JSZip.loadAsync(await (await buildResumeDocxBlob(resume)).arrayBuffer());
    const documentXml = await zip.file("word/document.xml")?.async("string");
    const skillPosition = documentXml?.indexOf("TypeScript") ?? -1;

    expect(skillPosition).toBeGreaterThan(0);
    expect(documentXml?.slice(Math.max(0, skillPosition - 250), skillPosition)).toContain("\u2022");
  });

  it("preserves skill layouts without exposing skill tables in Word", async () => {
    const exportSkillsForTemplate = async (
      templateId: "clean-slate" | "graduate" | "ledger" | "engineer",
    ) => {
      const resume = createBlankResume();
      resume.design.templateId = templateId;
      resume.sections.forEach((section) => {
        section.visible = section.type === "skills";
      });
      const skills = resume.sections.find((section) => section.type === "skills");
      if (!skills) throw new Error("Skills fixture is missing");
      skills.items = ["TypeScript", "React", "Node.js", "PostgreSQL"].map((title) => ({
        ...createEmptyItem(),
        title,
      }));

      const zip = await JSZip.loadAsync(await (await buildResumeDocxBlob(resume)).arrayBuffer());
      return await zip.file("word/document.xml")?.async("string") ?? "";
    };

    const listXml = await exportSkillsForTemplate("clean-slate");
    expect(listXml).not.toContain("<w:tbl>");
    expect(listXml).toContain("<w:tabs>");
    expect(listXml.match(/\u2022/g)).toHaveLength(4);
    expect(listXml).not.toContain("w:numPr");

    const chipsXml = await exportSkillsForTemplate("graduate");
    expect(chipsXml).not.toContain("<w:tbl>");
    expect(chipsXml.match(/a:prstGeom prst="roundRect"/g)).toHaveLength(4);
    expect(chipsXml).toContain('<a:gd name="adj" fmla="val 50000"/>');
    expect(chipsXml).toContain("<w:txbxContent>");
    expect(chipsXml).toContain("<a:solidFill>");
    expect(chipsXml).not.toContain("w:numPr");

    const outlineXml = await exportSkillsForTemplate("ledger");
    expect(outlineXml).not.toContain("<w:tbl>");
    expect(outlineXml.match(/a:prstGeom prst="roundRect"/g)).toHaveLength(4);
    expect(outlineXml).toContain("<a:ln");
    expect(outlineXml).toContain(">TypeScript</w:t>");
    expect(outlineXml).not.toContain("w:numPr");

    const techXml = await exportSkillsForTemplate("engineer");
    expect(techXml.match(/<w:tbl>/g)).toHaveLength(2);
    expect(techXml).toContain("TypeScript");
    expect(techXml).toContain("<w:shd");
    expect(techXml).not.toContain("w:numPr");
  });

  it("adds internal padding to every shaded section-heading treatment", async () => {
    const cases = [
      { templateId: "ledger" as const, sectionType: "summary", heading: "Professional Summary" },
      { templateId: "retail" as const, sectionType: "summary", heading: "Professional Summary" },
      { templateId: "graduate" as const, sectionType: "education", heading: "Education" },
    ];

    for (const testCase of cases) {
      const resume = createBlankResume();
      resume.design.templateId = testCase.templateId;
      resume.sections.forEach((section) => {
        section.visible = section.type === testCase.sectionType;
      });

      const zip = await JSZip.loadAsync(await (await buildResumeDocxBlob(resume)).arrayBuffer());
      const documentXml = await zip.file("word/document.xml")?.async("string") ?? "";
      const headingPosition = documentXml.indexOf(testCase.heading);
      const headingXml = documentXml.slice(Math.max(0, headingPosition - 1_000), headingPosition + 200);

      expect(headingPosition, testCase.templateId).toBeGreaterThan(0);
      expect(headingXml, testCase.templateId).toContain("<w:shd");
      expect(headingXml, testCase.templateId).toContain('w:space="3"');
      expect(headingXml, testCase.templateId).toContain(`\u00A0${testCase.heading}\u00A0`);
    }
  });

  it("embeds the optional Professional template photo without rasterizing text", async () => {
    const resume = createBlankResume();
    resume.design.templateId = "professional";
    resume.design.showPhoto = true;
    resume.personal.fullName = "Jamie Chen";
    resume.personal.photo =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    const zip = await JSZip.loadAsync(await (await buildResumeDocxBlob(resume)).arrayBuffer());
    const documentXml = await zip.file("word/document.xml")?.async("string");
    const mediaFiles = Object.keys(zip.files).filter(
      (fileName) => fileName.startsWith("word/media/") && !fileName.endsWith("/"),
    );

    expect(documentXml).toContain("Jamie Chen");
    expect(documentXml).toContain("Profile photo");
    expect(documentXml?.match(/<w:tbl>/g)?.length).toBeGreaterThanOrEqual(2);
    expect(documentXml).toContain('w:shd w:fill="');
    expect(mediaFiles).toHaveLength(1);
  });

  it("preserves the Tech main and sidebar composition as editable Word text", async () => {
    const resume = createBlankResume();
    resume.design.templateId = "engineer";
    resume.personal.fullName = "Avery Engineer";

    const zip = await JSZip.loadAsync(await (await buildResumeDocxBlob(resume)).arrayBuffer());
    const documentXml = await zip.file("word/document.xml")?.async("string");

    expect(documentXml).toContain("Avery Engineer");
    expect(documentXml).toContain("Professional Summary");
    expect(documentXml).toContain("Skills");
    expect(documentXml).toContain("<w:tbl>");
    expect(documentXml).toContain('w:shd w:fill="');
  });

  it("uses a native editable title rail for split-layout templates", async () => {
    const resume = createBlankResume();
    resume.design.templateId = "product";
    resume.personal.fullName = "Alex Product";

    const zip = await JSZip.loadAsync(await (await buildResumeDocxBlob(resume)).arrayBuffer());
    const documentXml = await zip.file("word/document.xml")?.async("string");

    expect(documentXml).toContain("Alex Product");
    expect(documentXml).toContain("Professional Summary");
    expect(documentXml).toContain("<w:tbl>");
    expect(documentXml).toContain("w:tblW");
  });
});
