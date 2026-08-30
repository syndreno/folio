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
  | "professional"
  | "sidebar"
  | "statement"
  | "showcase"
  | "monogram";

export interface ResumeTemplateVisualPreset {
  accentColor: string;
  paperColor: string;
  textColor: string;
  fontFamily: string;
  headingFontFamily: string;
}

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
  visualPreset: ResumeTemplateVisualPreset;
  component: LazyExoticComponent<ComponentType<ResumeTemplateProps>>;
}

const TEMPLATE_PALETTES: Record<TemplateCategory, Array<Pick<
  ResumeTemplateVisualPreset,
  "accentColor" | "paperColor" | "textColor"
>>> = {
  basic: [
    { accentColor: "#1D4F67", paperColor: "#FFFFFF", textColor: "#18231F" },
    { accentColor: "#355C50", paperColor: "#FFFDFC", textColor: "#202825" },
    { accentColor: "#253A5B", paperColor: "#FFFFFF", textColor: "#161D29" },
    { accentColor: "#70463B", paperColor: "#FFFCF8", textColor: "#29211E" },
    { accentColor: "#4A4D52", paperColor: "#FFFFFF", textColor: "#202124" },
    { accentColor: "#365E78", paperColor: "#FDFEFE", textColor: "#1B252B" },
  ],
  advanced: [
    { accentColor: "#246B64", paperColor: "#FCFFFE", textColor: "#172421" },
    { accentColor: "#B04B5A", paperColor: "#FFFDFC", textColor: "#272023" },
    { accentColor: "#315FA8", paperColor: "#FCFDFF", textColor: "#192233" },
    { accentColor: "#6E4E8C", paperColor: "#FEFCFF", textColor: "#261E2C" },
    { accentColor: "#A4582B", paperColor: "#FFFCF8", textColor: "#2C211A" },
    { accentColor: "#28708A", paperColor: "#FAFEFF", textColor: "#17262C" },
    { accentColor: "#49683C", paperColor: "#FCFEFA", textColor: "#1E271A" },
    { accentColor: "#854A62", paperColor: "#FFFBFD", textColor: "#2B1D23" },
    { accentColor: "#3F536D", paperColor: "#FCFDFF", textColor: "#1D2530" },
  ],
  premium: [
    { accentColor: "#163F59", paperColor: "#FFFDF9", textColor: "#1B2328" },
    { accentColor: "#8D3E48", paperColor: "#FFF9F7", textColor: "#2A2021" },
    { accentColor: "#285D4D", paperColor: "#FBFFF9", textColor: "#17241F" },
    { accentColor: "#60467A", paperColor: "#FFFBFF", textColor: "#251F2B" },
    { accentColor: "#8A5A18", paperColor: "#FFFCF5", textColor: "#2B251A" },
    { accentColor: "#254D78", paperColor: "#FAFCFF", textColor: "#182433" },
    { accentColor: "#7A4638", paperColor: "#FFF9F5", textColor: "#2C211D" },
    { accentColor: "#3B6467", paperColor: "#F8FEFD", textColor: "#172728" },
    { accentColor: "#4C5278", paperColor: "#FBFBFF", textColor: "#1F2230" },
  ],
};

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
  "veridian",
  "aperture",
  "maison",
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
  "boardroom",
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
  "aperture",
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
  if (["scholar", "framework", "engineer", "consultant", "executive", "director", "architect", "pinnacle", "boardroom"].includes(templateId)) {
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
  return ["professional", "functional", "tech", "sidebar", "showcase", "monogram"].includes(layout);
}

const FEATURED_VISUAL_PRESETS: Partial<Record<ResumeTemplateId, ResumeTemplateVisualPreset>> = {
  veridian: {
    accentColor: "#1E5A50",
    paperColor: "#FCFEFC",
    textColor: "#192421",
    fontFamily: "Calibri",
    headingFontFamily: "Georgia",
  },
  boardroom: {
    accentColor: "#263C5A",
    paperColor: "#FCFBF8",
    textColor: "#191F27",
    fontFamily: "Calibri",
    headingFontFamily: "Georgia",
  },
  aperture: {
    accentColor: "#B64E43",
    paperColor: "#FFF9F5",
    textColor: "#27201E",
    fontFamily: "Arial",
    headingFontFamily: "Arial",
  },
  maison: {
    accentColor: "#76536B",
    paperColor: "#FFFDFC",
    textColor: "#292126",
    fontFamily: "Calibri",
    headingFontFamily: "Georgia",
  },
};

function getVisualPreset(
  template: (typeof TEMPLATE_CATALOG)[number],
  index: number,
): ResumeTemplateVisualPreset {
  const featuredPreset = FEATURED_VISUAL_PRESETS[template.id];
  if (featuredPreset) return featuredPreset;
  const palettes = TEMPLATE_PALETTES[template.category];
  const palette = palettes[index % palettes.length] ?? palettes[0]!;
  const usesSerifHeading = template.headingTone !== "sans";
  return {
    ...palette,
    fontFamily: template.layout === "tech" ? "Arial" : "Calibri",
    headingFontFamily: usesSerifHeading ? "Georgia" : "Calibri",
  };
}

export const TEMPLATE_DEFINITIONS: ResumeTemplateDefinition[] = TEMPLATE_CATALOG.map(
  (template, index) => ({
    ...template,
    description: template.tagline,
    supportsTwoColumns: supportsTwoColumnComposition(template.layout),
    supportedPageSizes: ["A4", "LETTER"],
    format: getFormat(template.id),
    audience: getAudience(template.id),
    pageLength: getPageLength(template.id),
    visualPreset: getVisualPreset(template, index),
    layoutFamily: getLayoutFamily(template.layout),
    component: ConfigurableResumeTemplate,
  }),
);

export const TEMPLATE_REGISTRY = Object.fromEntries(
  TEMPLATE_DEFINITIONS.map((template) => [template.id, template]),
) as Record<ResumeTemplateId, ResumeTemplateDefinition>;
