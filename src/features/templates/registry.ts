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

export type ResumeTemplateFormat = "chronological" | "functional" | "combination";
export type ResumeTemplateAudience =
  | "general"
  | "student"
  | "technology"
  | "executive"
  | "creative"
  | "academic"
  | "service";
export type ResumeTemplatePageLength = "one-page" | "multi-page" | "flexible";
export type ResumeTemplateLayoutFamily =
  | "chronological"
  | "minimal"
  | "centered"
  | "banded"
  | "rail"
  | "boxed"
  | "split"
  | "editorial"
  | "executive"
  | "functional"
  | "student"
  | "tech"
  | "portfolio"
  | "healthcare"
  | "professional";

export interface ResumeTemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  description: string;
  category: TemplateCategory;
  atsRating: "optimized" | "compatible" | "creative";
  supportsPhoto: boolean;
  supportsTwoColumns: boolean;
  supportedPageSizes: PageSize[];
  format: ResumeTemplateFormat;
  audience: ResumeTemplateAudience;
  pageLength: ResumeTemplatePageLength;
  layoutFamily: ResumeTemplateLayoutFamily;
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

const FUNCTIONAL_TEMPLATES = new Set<ResumeTemplateId>([
  "clean-slate",
  "graduate",
  "technician",
  "catalyst",
  "engineer",
  "visionary",
]);

const COMBINATION_TEMPLATES = new Set<ResumeTemplateId>([
  "professional",
  "vertex",
  "studio",
  "portfolio",
  "product",
  "balanced",
  "founder",
]);

const STUDENT_TEMPLATES = new Set<ResumeTemplateId>(["graduate", "scholar"]);
const TECHNOLOGY_TEMPLATES = new Set<ResumeTemplateId>([
  "technician",
  "framework",
  "product",
  "engineer",
  "architect",
]);
const EXECUTIVE_TEMPLATES = new Set<ResumeTemplateId>([
  "consultant",
  "executive",
  "diplomat",
  "summit",
  "director",
  "pinnacle",
]);
const CREATIVE_TEMPLATES = new Set<ResumeTemplateId>([
  "studio",
  "portfolio",
  "editorial",
  "visionary",
  "prestige",
  "atelier",
  "founder",
  "luminous",
]);
const SERVICE_TEMPLATES = new Set<ResumeTemplateId>([
  "service",
  "retail",
  "hospitality",
  "healthcare-basic",
  "marketing",
]);

function getFormat(templateId: ResumeTemplateId): ResumeTemplateFormat {
  if (FUNCTIONAL_TEMPLATES.has(templateId)) return "functional";
  if (COMBINATION_TEMPLATES.has(templateId)) return "combination";
  return "chronological";
}

function getAudience(templateId: ResumeTemplateId): ResumeTemplateAudience {
  if (STUDENT_TEMPLATES.has(templateId)) return templateId === "scholar" ? "academic" : "student";
  if (TECHNOLOGY_TEMPLATES.has(templateId)) return "technology";
  if (EXECUTIVE_TEMPLATES.has(templateId)) return "executive";
  if (CREATIVE_TEMPLATES.has(templateId)) return "creative";
  if (SERVICE_TEMPLATES.has(templateId)) return "service";
  return "general";
}

function getPageLength(templateId: ResumeTemplateId): ResumeTemplatePageLength {
  if (["concise", "graduate", "retail", "technician", "signal"].includes(templateId)) {
    return "one-page";
  }
  if (["scholar", "framework", "engineer", "consultant", "executive", "director", "architect", "pinnacle"].includes(templateId)) {
    return "multi-page";
  }
  return "flexible";
}

function getLayoutFamily(layout: TemplateLayout): ResumeTemplateLayoutFamily {
  if (layout === "classic") return "chronological";
  if (layout === "band") return "banded";
  return layout;
}

function supportsTwoColumnComposition(layout: TemplateLayout): boolean {
  return layout === "professional" || layout === "functional" || layout === "tech";
}

export const TEMPLATE_DEFINITIONS: ResumeTemplateDefinition[] = TEMPLATE_CATALOG.map(
  (template) => ({
    ...template,
    description: template.tagline,
    supportsTwoColumns: supportsTwoColumnComposition(template.layout),
    supportedPageSizes: ["A4", "LETTER"],
    format: getFormat(template.id),
    audience: getAudience(template.id),
    pageLength: getPageLength(template.id),
    layoutFamily: getLayoutFamily(template.layout),
    component: ConfigurableResumeTemplate,
  }),
);

export const TEMPLATE_REGISTRY = Object.fromEntries(
  TEMPLATE_DEFINITIONS.map((template) => [template.id, template]),
) as Record<ResumeTemplateId, ResumeTemplateDefinition>;
