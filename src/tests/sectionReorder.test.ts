import { describe, expect, it } from "vitest";
import { createSection } from "../domain/resume.defaults";
import { reorderResumeSections } from "../domain/resume.transforms";

describe("resume section reordering", () => {
  const createSections = () => [
    createSection("summary", "Summary", 0),
    createSection("experience", "Experience", 1),
    createSection("skills", "Skills", 2),
    createSection("education", "Education", 3),
  ];

  it("places a dragged section before the drop target", () => {
    const sections = createSections();
    const result = reorderResumeSections(sections, sections[2]!.id, sections[0]!.id, "before");

    expect(result.map((section) => section.title)).toEqual([
      "Skills",
      "Summary",
      "Experience",
      "Education",
    ]);
    expect(result.map((section) => section.order)).toEqual([0, 1, 2, 3]);
  });

  it("places a dragged section after the drop target", () => {
    const sections = createSections();
    const result = reorderResumeSections(sections, sections[0]!.id, sections[2]!.id, "after");

    expect(result.map((section) => section.title)).toEqual([
      "Experience",
      "Skills",
      "Summary",
      "Education",
    ]);
  });

  it("does not mutate the original section array", () => {
    const sections = createSections();
    const originalTitles = sections.map((section) => section.title);

    reorderResumeSections(sections, sections[3]!.id, sections[0]!.id, "before");

    expect(sections.map((section) => section.title)).toEqual(originalTitles);
  });
});
