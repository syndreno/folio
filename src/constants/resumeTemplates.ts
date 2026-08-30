export type TemplateCategory = "basic" | "advanced" | "premium";
export type TemplateLayout =
  | "classic"
  | "minimal"
  | "centered"
  | "band"
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
export type TemplateSectionStyle =
  | "rule"
  | "plain"
  | "left-rule"
  | "band"
  | "double-rule"
  | "label"
  | "boxed"
  | "numbered";
export type TemplateSkillStyle = "chips" | "outline" | "inline" | "list";
export type TemplateDensity = "airy" | "balanced" | "compact";
export type TemplateHeadingTone = "serif" | "sans" | "mixed";

export interface ResumeTemplateCatalogEntry {
  id: string;
  name: string;
  category: TemplateCategory;
  tagline: string;
  atsRating: "optimized" | "compatible" | "creative";
  supportsPhoto: boolean;
  layout: TemplateLayout;
  sectionStyle: TemplateSectionStyle;
  skillStyle: TemplateSkillStyle;
  density: TemplateDensity;
  headingTone: TemplateHeadingTone;
}

// Each template has a unique combination of layout, section treatment,
// density, typography tone, and skill presentation. Content remains separate.
export const TEMPLATE_CATALOG = [
  { id: "classic", name: "Classic ATS", category: "basic", tagline: "Traditional hierarchy with dependable rules.", atsRating: "optimized", supportsPhoto: false, layout: "classic", sectionStyle: "rule", skillStyle: "inline", density: "balanced", headingTone: "serif" },
  { id: "clean-slate", name: "Clean Slate", category: "basic", tagline: "Open whitespace and quiet headings.", atsRating: "optimized", supportsPhoto: false, layout: "minimal", sectionStyle: "plain", skillStyle: "list", density: "airy", headingTone: "sans" },
  { id: "simple-line", name: "Simple Line", category: "basic", tagline: "Crisp dividers for fast scanning.", atsRating: "optimized", supportsPhoto: false, layout: "minimal", sectionStyle: "rule", skillStyle: "inline", density: "balanced", headingTone: "sans" },
  { id: "civic", name: "Civic", category: "basic", tagline: "Centered formality for public-service roles.", atsRating: "optimized", supportsPhoto: false, layout: "centered", sectionStyle: "double-rule", skillStyle: "list", density: "balanced", headingTone: "serif" },
  { id: "ledger", name: "Ledger", category: "basic", tagline: "Structured labels with accounting precision.", atsRating: "optimized", supportsPhoto: false, layout: "classic", sectionStyle: "label", skillStyle: "outline", density: "compact", headingTone: "serif" },
  { id: "concise", name: "Concise", category: "basic", tagline: "Space-efficient for experienced candidates.", atsRating: "optimized", supportsPhoto: false, layout: "minimal", sectionStyle: "plain", skillStyle: "inline", density: "compact", headingTone: "sans" },
  { id: "monochrome", name: "Monochrome", category: "basic", tagline: "Restrained editorial black-and-white structure.", atsRating: "compatible", supportsPhoto: false, layout: "editorial", sectionStyle: "rule", skillStyle: "list", density: "balanced", headingTone: "serif" },
  { id: "standard", name: "Standard", category: "basic", tagline: "A familiar recruiter-first document pattern.", atsRating: "optimized", supportsPhoto: false, layout: "classic", sectionStyle: "plain", skillStyle: "list", density: "balanced", headingTone: "sans" },
  { id: "clearpath", name: "Clearpath", category: "basic", tagline: "Strong left markers guide the reading path.", atsRating: "optimized", supportsPhoto: false, layout: "rail", sectionStyle: "left-rule", skillStyle: "inline", density: "balanced", headingTone: "sans" },
  { id: "baseline", name: "Baseline", category: "basic", tagline: "Compact rules and consistent rhythm.", atsRating: "optimized", supportsPhoto: false, layout: "classic", sectionStyle: "double-rule", skillStyle: "outline", density: "compact", headingTone: "mixed" },
  { id: "scholar", name: "Scholar", category: "basic", tagline: "Academic typography with generous reading space.", atsRating: "compatible", supportsPhoto: false, layout: "editorial", sectionStyle: "plain", skillStyle: "list", density: "airy", headingTone: "serif" },
  { id: "graduate", name: "Graduate", category: "basic", tagline: "Education-first hierarchy for early-career resumes.", atsRating: "optimized", supportsPhoto: false, layout: "student", sectionStyle: "rule", skillStyle: "chips", density: "airy", headingTone: "sans" },
  { id: "service", name: "Service", category: "basic", tagline: "Direct labels for customer-facing experience.", atsRating: "optimized", supportsPhoto: false, layout: "boxed", sectionStyle: "label", skillStyle: "list", density: "balanced", headingTone: "sans" },
  { id: "retail", name: "Retail", category: "basic", tagline: "Energetic bands with simple content flow.", atsRating: "optimized", supportsPhoto: false, layout: "band", sectionStyle: "band", skillStyle: "chips", density: "compact", headingTone: "sans" },
  { id: "hospitality", name: "Hospitality", category: "basic", tagline: "Welcoming centered header and light accents.", atsRating: "optimized", supportsPhoto: false, layout: "centered", sectionStyle: "label", skillStyle: "outline", density: "airy", headingTone: "mixed" },
  { id: "healthcare-basic", name: "Healthcare", category: "basic", tagline: "Calm clinical structure for licenses, skills, and experience.", atsRating: "optimized", supportsPhoto: false, layout: "healthcare", sectionStyle: "rule", skillStyle: "list", density: "balanced", headingTone: "sans" },
  { id: "technician", name: "Technician", category: "basic", tagline: "Technical matrix with compact evidence-led entries.", atsRating: "compatible", supportsPhoto: false, layout: "tech", sectionStyle: "boxed", skillStyle: "inline", density: "compact", headingTone: "sans" },
  { id: "essential", name: "Essential", category: "basic", tagline: "Only the hierarchy a recruiter needs.", atsRating: "optimized", supportsPhoto: false, layout: "minimal", sectionStyle: "left-rule", skillStyle: "outline", density: "airy", headingTone: "mixed" },

  { id: "modern", name: "Modern ATS", category: "advanced", tagline: "Contemporary tonal header and accent markers.", atsRating: "optimized", supportsPhoto: false, layout: "band", sectionStyle: "left-rule", skillStyle: "outline", density: "balanced", headingTone: "sans" },
  { id: "professional", name: "Professional", category: "advanced", tagline: "Photo-ready identity header with a true skills sidebar.", atsRating: "compatible", supportsPhoto: true, layout: "professional", sectionStyle: "rule", skillStyle: "chips", density: "balanced", headingTone: "mixed" },
  { id: "precision", name: "Precision", category: "advanced", tagline: "Exact boxed geometry for analytical roles.", atsRating: "optimized", supportsPhoto: false, layout: "boxed", sectionStyle: "boxed", skillStyle: "outline", density: "compact", headingTone: "sans" },
  { id: "catalyst", name: "Catalyst", category: "advanced", tagline: "Skill-first structure for transferable strengths.", atsRating: "compatible", supportsPhoto: false, layout: "functional", sectionStyle: "numbered", skillStyle: "chips", density: "balanced", headingTone: "sans" },
  { id: "horizon", name: "Horizon", category: "advanced", tagline: "Wide centered identity with airy divisions.", atsRating: "optimized", supportsPhoto: false, layout: "centered", sectionStyle: "band", skillStyle: "outline", density: "airy", headingTone: "sans" },
  { id: "vertex", name: "Vertex", category: "advanced", tagline: "Angular labels and compact technical detail.", atsRating: "compatible", supportsPhoto: false, layout: "split", sectionStyle: "label", skillStyle: "inline", density: "compact", headingTone: "sans" },
  { id: "metro", name: "Metro", category: "advanced", tagline: "Urban blocks with confident section bands.", atsRating: "compatible", supportsPhoto: true, layout: "boxed", sectionStyle: "band", skillStyle: "chips", density: "balanced", headingTone: "sans" },
  { id: "studio", name: "Studio", category: "advanced", tagline: "Editorial header for portfolio-led careers.", atsRating: "compatible", supportsPhoto: true, layout: "editorial", sectionStyle: "label", skillStyle: "chips", density: "airy", headingTone: "serif" },
  { id: "signal", name: "Signal", category: "advanced", tagline: "High-clarity rail with compact outline skills.", atsRating: "optimized", supportsPhoto: false, layout: "rail", sectionStyle: "double-rule", skillStyle: "outline", density: "compact", headingTone: "mixed" },
  { id: "ascent", name: "Ascent", category: "advanced", tagline: "Progressive numbered sections and open spacing.", atsRating: "compatible", supportsPhoto: false, layout: "minimal", sectionStyle: "numbered", skillStyle: "chips", density: "airy", headingTone: "sans" },
  { id: "framework", name: "Framework", category: "advanced", tagline: "Systematic boxes for engineering leadership.", atsRating: "optimized", supportsPhoto: false, layout: "executive", sectionStyle: "boxed", skillStyle: "inline", density: "compact", headingTone: "mixed" },
  { id: "portfolio", name: "Portfolio", category: "advanced", tagline: "Project-led case-study composition for portfolio careers.", atsRating: "compatible", supportsPhoto: true, layout: "portfolio", sectionStyle: "band", skillStyle: "outline", density: "balanced", headingTone: "serif" },
  { id: "product", name: "Product", category: "advanced", tagline: "Balanced product-story hierarchy and labels.", atsRating: "compatible", supportsPhoto: false, layout: "split", sectionStyle: "rule", skillStyle: "chips", density: "balanced", headingTone: "sans" },
  { id: "engineer", name: "Engineer", category: "advanced", tagline: "Technical matrix and timeline for engineering depth.", atsRating: "compatible", supportsPhoto: false, layout: "tech", sectionStyle: "boxed", skillStyle: "inline", density: "compact", headingTone: "sans" },
  { id: "analyst", name: "Analyst", category: "advanced", tagline: "Measured typography and data-friendly spacing.", atsRating: "optimized", supportsPhoto: false, layout: "classic", sectionStyle: "numbered", skillStyle: "outline", density: "compact", headingTone: "mixed" },
  { id: "marketing", name: "Marketing", category: "advanced", tagline: "Branded header with energetic skill chips.", atsRating: "compatible", supportsPhoto: true, layout: "band", sectionStyle: "label", skillStyle: "chips", density: "airy", headingTone: "sans" },
  { id: "consultant", name: "Consultant", category: "advanced", tagline: "Executive structure with concise evidence.", atsRating: "optimized", supportsPhoto: false, layout: "executive", sectionStyle: "rule", skillStyle: "list", density: "balanced", headingTone: "serif" },
  { id: "balanced", name: "Balanced", category: "advanced", tagline: "Split identity and evenly weighted sections.", atsRating: "compatible", supportsPhoto: false, layout: "split", sectionStyle: "double-rule", skillStyle: "outline", density: "airy", headingTone: "mixed" },

  { id: "executive", name: "Executive", category: "premium", tagline: "Boardroom authority with double-rule structure.", atsRating: "compatible", supportsPhoto: true, layout: "executive", sectionStyle: "double-rule", skillStyle: "inline", density: "airy", headingTone: "serif" },
  { id: "aurora", name: "Aurora", category: "premium", tagline: "Luminous banding and elegant label rhythm.", atsRating: "compatible", supportsPhoto: true, layout: "band", sectionStyle: "label", skillStyle: "outline", density: "airy", headingTone: "mixed" },
  { id: "obsidian", name: "Obsidian", category: "premium", tagline: "Dark-accent geometry with sharp boxed sections.", atsRating: "compatible", supportsPhoto: true, layout: "boxed", sectionStyle: "boxed", skillStyle: "chips", density: "compact", headingTone: "sans" },
  { id: "emerald", name: "Emerald", category: "premium", tagline: "Refined rail details and spacious typography.", atsRating: "compatible", supportsPhoto: true, layout: "rail", sectionStyle: "label", skillStyle: "chips", density: "airy", headingTone: "serif" },
  { id: "royal", name: "Royal", category: "premium", tagline: "Formal centered identity with framed headings.", atsRating: "compatible", supportsPhoto: true, layout: "centered", sectionStyle: "boxed", skillStyle: "outline", density: "balanced", headingTone: "serif" },
  { id: "editorial", name: "Editorial", category: "premium", tagline: "Magazine-inspired type with minimal rules.", atsRating: "compatible", supportsPhoto: true, layout: "editorial", sectionStyle: "plain", skillStyle: "inline", density: "airy", headingTone: "serif" },
  { id: "diplomat", name: "Diplomat", category: "premium", tagline: "Ceremonial balance and restrained section bands.", atsRating: "compatible", supportsPhoto: true, layout: "executive", sectionStyle: "band", skillStyle: "list", density: "balanced", headingTone: "serif" },
  { id: "visionary", name: "Visionary", category: "premium", tagline: "Forward-looking split header and numbered flow.", atsRating: "creative", supportsPhoto: true, layout: "split", sectionStyle: "numbered", skillStyle: "chips", density: "airy", headingTone: "sans" },
  { id: "summit", name: "Summit", category: "premium", tagline: "High-impact rail for leadership progression.", atsRating: "compatible", supportsPhoto: true, layout: "rail", sectionStyle: "double-rule", skillStyle: "outline", density: "balanced", headingTone: "mixed" },
  { id: "prestige", name: "Prestige", category: "premium", tagline: "Luxury editorial spacing with fine rules.", atsRating: "compatible", supportsPhoto: true, layout: "editorial", sectionStyle: "double-rule", skillStyle: "chips", density: "airy", headingTone: "serif" },
  { id: "signature", name: "Signature", category: "premium", tagline: "Personal centered mark with clean labels.", atsRating: "compatible", supportsPhoto: true, layout: "centered", sectionStyle: "label", skillStyle: "inline", density: "balanced", headingTone: "mixed" },
  { id: "atelier", name: "Atelier", category: "premium", tagline: "Creative framing for design-led applications.", atsRating: "creative", supportsPhoto: true, layout: "boxed", sectionStyle: "numbered", skillStyle: "chips", density: "airy", headingTone: "serif" },
  { id: "director", name: "Director", category: "premium", tagline: "Decisive banded hierarchy for senior leaders.", atsRating: "compatible", supportsPhoto: true, layout: "band", sectionStyle: "double-rule", skillStyle: "inline", density: "compact", headingTone: "serif" },
  { id: "founder", name: "Founder", category: "premium", tagline: "Confident split narrative with bold labels.", atsRating: "creative", supportsPhoto: true, layout: "split", sectionStyle: "band", skillStyle: "chips", density: "balanced", headingTone: "sans" },
  { id: "architect", name: "Architect", category: "premium", tagline: "Grid-like precision with editorial character.", atsRating: "compatible", supportsPhoto: true, layout: "executive", sectionStyle: "boxed", skillStyle: "outline", density: "compact", headingTone: "mixed" },
  { id: "luminous", name: "Luminous", category: "premium", tagline: "Airy tonal blocks and understated headings.", atsRating: "compatible", supportsPhoto: true, layout: "minimal", sectionStyle: "band", skillStyle: "chips", density: "airy", headingTone: "mixed" },
  { id: "pinnacle", name: "Pinnacle", category: "premium", tagline: "Peak executive framing with numbered sections.", atsRating: "compatible", supportsPhoto: true, layout: "executive", sectionStyle: "numbered", skillStyle: "outline", density: "balanced", headingTone: "serif" },
  { id: "distinction", name: "Distinction", category: "premium", tagline: "Elegant rail and framed labels for standout careers.", atsRating: "compatible", supportsPhoto: true, layout: "rail", sectionStyle: "boxed", skillStyle: "chips", density: "airy", headingTone: "serif" },
] as const satisfies readonly ResumeTemplateCatalogEntry[];

export type ResumeTemplateId = (typeof TEMPLATE_CATALOG)[number]["id"];

export const RESUME_TEMPLATE_IDS = TEMPLATE_CATALOG.map(
  (template) => template.id,
) as [ResumeTemplateId, ...ResumeTemplateId[]];

export function getResumeTemplate(templateId: ResumeTemplateId): (typeof TEMPLATE_CATALOG)[number] {
  return TEMPLATE_CATALOG.find((template) => template.id === templateId) ?? TEMPLATE_CATALOG[0];
}

export function getTemplateDensityFactor(density: TemplateDensity): number {
  if (density === "compact") return 0.78;
  if (density === "airy") return 1.16;
  return 1;
}
