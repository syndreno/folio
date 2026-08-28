import type { ResumeSection } from "./resume.types";

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
