import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import {
  TEMPLATE_CATALOG,
  type TemplateCategory,
  type TemplateDensity,
  type TemplateHeadingTone,
  type TemplateLayout,
  type TemplateSectionStyle,
  type TemplateSkillStyle,
} from "../../constants/resumeTemplates";
import type { PageSize, ResumeTemplateId } from "../../domain/resume.types";
import type { ResumeTemplateProps } from "./template.types";

export interface ResumeTemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  description: string;
  category: TemplateCategory;
  atsRating: "optimized" | "compatible" | "creative";
  supportsPhoto: boolean;
  supportsTwoColumns: boolean;
  supportedPageSizes: PageSize[];
  layout: TemplateLayout;
  sectionStyle: TemplateSectionStyle;
  skillStyle: TemplateSkillStyle;
  density: TemplateDensity;
  headingTone: TemplateHeadingTone;
  component: LazyExoticComponent<ComponentType<ResumeTemplateProps>>;
}

const ConfigurableResumeTemplate = lazy(() =>
  import("./classic/ClassicTemplate").then((module) => ({ default: module.ClassicTemplate })),
);

export const TEMPLATE_DEFINITIONS: ResumeTemplateDefinition[] = TEMPLATE_CATALOG.map(
  (template) => ({
    ...template,
    description: template.tagline,
    supportsTwoColumns: false,
    supportedPageSizes: ["A4", "LETTER"],
    component: ConfigurableResumeTemplate,
  }),
);

export const TEMPLATE_REGISTRY = Object.fromEntries(
  TEMPLATE_DEFINITIONS.map((template) => [template.id, template]),
) as Record<ResumeTemplateId, ResumeTemplateDefinition>;
