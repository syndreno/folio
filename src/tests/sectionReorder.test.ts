import { describe, expect, it } from "vitest";
import { createSection } from "../domain/resume.defaults";
import {
  duplicateResumeSection,
  reorderResumeSectionItems,
  reorderResumeSections,
} from "../domain/resume.transforms";

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

describe("resume section copying", () => {
  it("deep-copies content with new IDs and a unique title", () => {
    const source = createSection("experience", "Experience", 0);
    source.items[0]!.title = "Senior Engineer";
    source.items[0]!.bullets = ["Improved performance by 30%."];

    const firstResult = duplicateResumeSection([source], source.id);
    const firstCopy = firstResult[1];

    expect(firstResult.map((section) => section.title)).toEqual([
      "Experience",
      "Experience Copy",
    ]);
    expect(firstCopy?.id).not.toBe(source.id);
    expect(firstCopy?.items[0]?.id).not.toBe(source.items[0]?.id);
    expect(firstCopy?.items[0]?.bullets).toEqual(source.items[0]?.bullets);
    expect(firstCopy?.items[0]?.bullets).not.toBe(source.items[0]?.bullets);

    const secondResult = duplicateResumeSection(firstResult, firstCopy!.id);
    expect(secondResult.map((section) => section.title)).toEqual([
      "Experience",
      "Experience Copy",
      "Experience Copy 2",
    ]);
    expect(secondResult.map((section) => section.order)).toEqual([0, 1, 2]);
  });
});

describe("resume entry reordering", () => {
  it("reorders items only inside the selected section", () => {
    const experience = createSection("experience", "Experience", 0);
    experience.items = [
      { ...experience.items[0]!, id: "first", title: "First role" },
      { ...experience.items[0]!, id: "second", title: "Second role" },
      { ...experience.items[0]!, id: "third", title: "Third role" },
    ];
    const skills = createSection("skills", "Skills", 1);
    const originalSkills = skills.items;

    const result = reorderResumeSectionItems(
      [experience, skills],
      experience.id,
      "third",
      "first",
      "before",
    );

    expect(result[0]?.items.map((item) => item.title)).toEqual([
      "Third role",
      "First role",
      "Second role",
    ]);
    expect(result[1]?.items).toBe(originalSkills);
    expect(experience.items.map((item) => item.title)).toEqual([
      "First role",
      "Second role",
      "Third role",
    ]);
  });
});
