import { afterEach, describe, expect, it } from "vitest";
import {
  findRenderedResumePages,
  shouldIncludeResumeImageNode,
} from "../features/export/image/exportResumeImages";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("multi-page image export", () => {
  it("finds every visible preview page and excludes the measurement page", () => {
    document.body.innerHTML = `
      <div class="preview-scroll">
        <article class="resume-page">Page 1</article>
        <article class="resume-page letter">Page 2</article>
        <article class="resume-page resume-measurement">Measurement</article>
      </div>
    `;

    expect(findRenderedResumePages().map((page) => page.textContent)).toEqual(["Page 1", "Page 2"]);
  });

  it("excludes live editor drag handles from PNG and JPEG captures", () => {
    const sectionHandle = document.createElement("span");
    sectionHandle.className = "preview-drag-handle";
    const entryHandle = document.createElement("span");
    entryHandle.className = "preview-entry-drag-handle";
    const resumeText = document.createElement("p");
    resumeText.className = "resume-summary";
    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const textNode = document.createTextNode("Selectable resume text");

    expect(shouldIncludeResumeImageNode(sectionHandle)).toBe(false);
    expect(shouldIncludeResumeImageNode(entryHandle)).toBe(false);
    expect(shouldIncludeResumeImageNode(resumeText)).toBe(true);
    expect(shouldIncludeResumeImageNode(svgIcon)).toBe(true);
    expect(shouldIncludeResumeImageNode(textNode)).toBe(true);
  });
});
