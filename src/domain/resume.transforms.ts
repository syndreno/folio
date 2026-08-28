import type { ResumeSection } from "./resume.types";
import { createId } from "./resume.defaults";

export type SectionDropPosition = "before" | "after";

/** Reorders sections without mutating resume state or changing section IDs. */
export function reorderResumeSections(
  sections: ResumeSection[],
  sourceSectionId: string,
  targetSectionId: string,
  position: SectionDropPosition,
): ResumeSection[] {
  if (sourceSectionId === targetSectionId) return sections;

  const ordered = [...sections].sort((first, second) => first.order - second.order);
  const sourceIndex = ordered.findIndex((section) => section.id === sourceSectionId);
  if (sourceIndex < 0) return sections;

  const [sourceSection] = ordered.splice(sourceIndex, 1);
  if (!sourceSection) return sections;
  const targetIndex = ordered.findIndex((section) => section.id === targetSectionId);
  if (targetIndex < 0) return sections;

  const insertionIndex = position === "after" ? targetIndex + 1 : targetIndex;
  ordered.splice(insertionIndex, 0, sourceSection);
  return ordered.map((section, order) => ({ ...section, order }));
}

/** Reorders entries within one section while preserving every item ID. */
export function reorderResumeSectionItems(
  sections: ResumeSection[],
  sectionId: string,
  sourceItemId: string,
  targetItemId: string,
  position: SectionDropPosition,
): ResumeSection[] {
  if (sourceItemId === targetItemId) return sections;
  const section = sections.find((candidate) => candidate.id === sectionId);
  if (!section) return sections;

  const items = [...section.items];
  const sourceIndex = items.findIndex((item) => item.id === sourceItemId);
  if (sourceIndex < 0) return sections;
  const [sourceItem] = items.splice(sourceIndex, 1);
  if (!sourceItem) return sections;

  const targetIndex = items.findIndex((item) => item.id === targetItemId);
  if (targetIndex < 0) return sections;
  items.splice(position === "after" ? targetIndex + 1 : targetIndex, 0, sourceItem);

  return sections.map((candidate) =>
    candidate.id === sectionId ? { ...candidate, items } : candidate,
  );
}

/** Creates an independent deep copy directly after the source section. */
export function duplicateResumeSection(
  sections: ResumeSection[],
  sourceSectionId: string,
): ResumeSection[] {
  const ordered = [...sections].sort((first, second) => first.order - second.order);
  const sourceIndex = ordered.findIndex((section) => section.id === sourceSectionId);
  const source = ordered[sourceIndex];
  if (!source) return sections;

  const baseTitle = source.title.replace(/\s+copy(?:\s+\d+)?$/i, "").trim() || "Section";
  const existingTitles = new Set(
    sections.map((section) => section.title.trim().toLocaleLowerCase("en")),
  );
  let copyTitle = `${baseTitle} Copy`;
  let copyNumber = 2;
  while (existingTitles.has(copyTitle.toLocaleLowerCase("en"))) {
    copyTitle = `${baseTitle} Copy ${copyNumber}`;
    copyNumber += 1;
  }

  const copy: ResumeSection = {
    ...source,
    id: createId("section"),
    title: copyTitle,
    items: source.items.map((item) => ({
      ...item,
      id: createId("item"),
      bullets: [...item.bullets],
    })),
  };
  ordered.splice(sourceIndex + 1, 0, copy);
  return ordered.map((section, order) => ({ ...section, order }));
}
