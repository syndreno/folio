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
    expect(documentXml).not.toContain("<w:pBdr><w:bottom");
    expect(documentXml).toContain('w:background w:color="F7F9FC"');
    expect(stylesXml).toContain('w:color w:val="2F6FED"');
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
    expect(mediaFiles).toHaveLength(1);
  });
});
