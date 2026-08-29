import { lazy, type LazyExoticComponent, type ComponentType } from "react";
import type { PageSize, ResumeTemplateId } from "../../domain/resume.types";
import type { ResumeTemplateProps } from "./template.types";

export interface ResumeTemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  description: string;
  atsRating: "optimized" | "compatible" | "creative";
  supportsPhoto: boolean;
  supportsTwoColumns: boolean;
  supportedPageSizes: PageSize[];
  component: LazyExoticComponent<ComponentType<ResumeTemplateProps>>;
}

const ClassicTemplate = lazy(() =>
  import("./classic/ClassicTemplate").then((module) => ({ default: module.ClassicTemplate })),
);
const ModernTemplate = lazy(() =>
  import("./modern/ModernTemplate").then((module) => ({ default: module.ModernTemplate })),
);
const ProfessionalTemplate = lazy(() =>
  import("./professional/ProfessionalTemplate").then((module) => ({
    default: module.ProfessionalTemplate,
  })),
);

export const TEMPLATE_REGISTRY: Readonly<Record<ResumeTemplateId, ResumeTemplateDefinition>> = {
  classic: {
    id: "classic",
    name: "Classic ATS",
    description: "Traditional headings and understated rules for universal readability.",
    atsRating: "optimized",
    supportsPhoto: false,
    supportsTwoColumns: false,
    supportedPageSizes: ["A4", "LETTER"],
    component: ClassicTemplate,
  },
  modern: {
    id: "modern",
    name: "Modern ATS",
    description: "A sharper single-column layout with contemporary accent details.",
    atsRating: "optimized",
    supportsPhoto: false,
    supportsTwoColumns: false,
    supportedPageSizes: ["A4", "LETTER"],
    component: ModernTemplate,
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "A polished single-column layout with optional profile photo support.",
    atsRating: "compatible",
    supportsPhoto: true,
    supportsTwoColumns: false,
    supportedPageSizes: ["A4", "LETTER"],
    component: ProfessionalTemplate,
  },
};

export const TEMPLATE_DEFINITIONS = Object.values(TEMPLATE_REGISTRY);
