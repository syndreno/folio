import type { ResumeDocument } from "../../domain/resume.types";
import type { SectionDropPosition } from "../../domain/resume.transforms";

export interface ResumeTemplateProps {
  resume: ResumeDocument;
  onSectionReorder?: (
    sourceSectionId: string,
    targetSectionId: string,
    position: SectionDropPosition,
  ) => void;
  onItemReorder?: (
    sectionId: string,
    sourceItemId: string,
    targetItemId: string,
    position: SectionDropPosition,
  ) => void;
  onSectionSelect?: (sectionId: string) => void;
}
