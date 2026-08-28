import { SECTION_ALIASES } from "../../constants/sectionAliases";
import { ATS_SAFE_FONTS } from "../../domain/resume.defaults";
import { emailSchema, safeWebUrlSchema } from "../../domain/resume.schema";
import type { ResumeDocument, ResumeSectionItem } from "../../domain/resume.types";
import { contrastRatio } from "../../utils/color";

export type AtsCategory = "Contact" | "Sections" | "Content" | "Dates" | "Design" | "Export";

export interface AtsFinding {
  id: string;
  category: AtsCategory;
  status: "pass" | "warning";
  title: string;
  detail: string;
}

export interface AtsAnalysis {
  score: number;
  passed: number;
  warnings: number;
  estimatedPages: number;
  findings: AtsFinding[];
}

interface WeightedFinding extends AtsFinding {
  weight: number;
}

const PLACEHOLDER_VALUES = new Set([
  "new entry",
  "your name",
  "your professional title",
  "write a concise professional summary here.",
]);

const REPEATED_WORD_EXCLUSIONS = new Set([
  "about", "after", "also", "been", "before", "company", "from", "have", "more",
  "present", "than", "that", "their", "through", "using", "with",
]);

const MONTHS = [
  "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december",
];

const SHORT_MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
];

function createFinding(
  category: AtsCategory,
  id: string,
  passed: boolean,
  title: string,
  passDetail: string,
  warningDetail: string,
  weight: number,
): WeightedFinding {
  return {
    category,
    id,
    status: passed ? "pass" : "warning",
    title,
    detail: passed ? passDetail : warningDetail,
    weight,
  };
}

function itemText(item: ResumeSectionItem): string {
  return [item.title, item.subtitle, item.meta, item.description, ...item.bullets].join(" ");
}

function collectResumeText(resume: ResumeDocument): string {
  const personalText = [
    resume.personal.fullName,
    resume.personal.professionalTitle,
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
  ];
  const sectionText = resume.sections
    .filter((section) => section.visible)
    .flatMap((section) => [section.title, section.content, ...section.items.map(itemText)]);
  return [...personalText, ...sectionText].join(" ");
}

function isMeaningful(value: string): boolean {
  const normalized = value.trim().toLocaleLowerCase("en");
  return normalized.length > 0 && !PLACEHOLDER_VALUES.has(normalized);
}

function findRepeatedWords(text: string): string[] {
  const words = text.toLocaleLowerCase("en").match(/[\p{L}\p{N}][\p{L}\p{N}'’-]{3,}/gu) ?? [];
  const meaningfulWords = words.filter((word) => !REPEATED_WORD_EXCLUSIONS.has(word));
  const counts = new Map<string, number>();
  for (const word of meaningfulWords) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count >= 8 && count / Math.max(meaningfulWords.length, 1) >= 0.035)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 4)
    .map(([word]) => word);
}

type DateStyle = "long-month" | "short-month" | "year" | "numeric" | "unknown";

function detectDateStyle(meta: string): DateStyle {
  const datePart = (meta.split("|")[0] ?? meta).trim().toLocaleLowerCase("en");
  if (MONTHS.some((month) => new RegExp(`\\b${month}\\s+\\d{4}\\b`).test(datePart))) {
    return "long-month";
  }
  if (SHORT_MONTHS.some((month) => new RegExp(`\\b${month}\\.?\\s+\\d{4}\\b`).test(datePart))) {
    return "short-month";
  }
  if (/^\d{4}\s*(?:-|–|—|to)\s*(?:\d{4}|present|current)$/i.test(datePart)) return "year";
  if (/^\d{4}$/.test(datePart)) return "year";
  if (/\b\d{1,2}[/-]\d{2,4}\b/.test(datePart)) return "numeric";
  return "unknown";
}

function extractDateSource(item: ResumeSectionItem): string {
  if (/\d{4}|present|current/i.test(item.meta)) return item.meta;
  const fallbackText = [item.description, item.subtitle, item.title].join(" ");
  const dateMatch = fallbackText.match(
    /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4}|\d{4})(?:\s*(?:-|–|—|to)\s*(?:\d{4}|Present|Current))?/i,
  );
  return dateMatch?.[0] ?? "";
}

function estimatePageCount(resume: ResumeDocument): number {
  const visibleSections = resume.sections.filter((section) => section.visible);
  const words = collectResumeText(resume).match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  const itemCount = visibleSections.reduce((total, section) => total + section.items.length, 0);
  const bulletCount = visibleSections.reduce(
    (total, section) => total + section.items.reduce((subtotal, item) => subtotal + item.bullets.length, 0),
    0,
  );
  const layoutUnits = words + itemCount * 16 + bulletCount * 5 + visibleSections.length * 12;
  const density = (10.5 / resume.design.fontSize) * (1.25 / resume.design.lineHeight);
  const capacity = Math.max(360, 610 * density);
  return Math.max(1, Math.ceil(layoutUnits / capacity));
}

function hasUnsupportedSymbols(text: string): boolean {
  return /[\uE000-\uF8FF�]/u.test(text) || /\p{Extended_Pictographic}/u.test(text);
}

export function analyzeAtsReadiness(resume: ResumeDocument): AtsAnalysis {
  const visibleSections = resume.sections.filter((section) => section.visible);
  const visibleTypes = new Set(visibleSections.map((section) => section.type));
  const experience = visibleSections.find((section) => section.type === "experience");
  const skills = visibleSections.find((section) => section.type === "skills");
  const experienceBullets = experience?.items.flatMap((item) => item.bullets) ?? [];
  const quantifiedBullets = experienceBullets.filter((bullet) =>
    /(?:\d|%|\$|₹|€|£|million|thousand|hours?|days?|users?|customers?)/i.test(bullet),
  );
  const longContent = visibleSections.some(
    (section) =>
      section.content.length > 500 ||
      section.items.some(
        (item) => item.description.length > 350 || item.bullets.some((bullet) => bullet.length > 220),
      ),
  );
  const emptySections = visibleSections.filter(
    (section) =>
      !isMeaningful(section.content) &&
      !section.items.some((item) =>
        [item.title, item.subtitle, item.meta, item.description, ...item.bullets].some(isMeaningful),
      ),
  );
  const unclearHeadings = visibleSections.filter((section) => {
    if (section.type === "custom") return true;
    return !SECTION_ALIASES[section.type].includes(section.title.trim().toLocaleLowerCase("en"));
  });
  const webLinks = [
    resume.personal.website,
    resume.personal.linkedin,
    resume.personal.github,
    ...resume.personal.customLinks.map((link) => link.url),
  ].filter(Boolean);
  const linksAreSafe = webLinks.every((link) => safeWebUrlSchema.safeParse(link).success);
  const repeatedWords = findRepeatedWords(collectResumeText(resume));
  const dateItems = visibleSections
    .filter((section) => ["experience", "education", "projects", "certifications"].includes(section.type))
    .flatMap((section) => section.items)
    .filter((item) => isMeaningful(item.title));
  const dateSources = dateItems.map(extractDateSource);
  const dateStyles = dateSources.map(detectDateStyle);
  const knownDateStyles = dateStyles.filter((style) => style !== "unknown" && style !== "numeric");
  const missingDates = dateSources.filter((source) => !source);
  const inconsistentDates = new Set(knownDateStyles).size > 1;
  const resumeText = collectResumeText(resume);
  const estimatedPages = estimatePageCount(resume);
  const skillCount = skills?.items.filter((item) => isMeaningful(item.title)).length ?? 0;

  const checks: WeightedFinding[] = [
    createFinding("Contact", "contact.full-name", isMeaningful(resume.personal.fullName), "Full name", "A full name is present as normal text.", "Replace the placeholder with your full name.", 5),
    createFinding("Contact", "contact.professional-title", isMeaningful(resume.personal.professionalTitle), "Professional title", "A professional title is present below the name.", "Add a clear professional title aligned with the target role.", 3),
    createFinding("Contact", "contact.email", emailSchema.safeParse(resume.personal.email).success, "Email address", "A valid email address is available to parsers.", "Add a valid email address in Personal details.", 5),
    createFinding("Contact", "contact.phone", resume.personal.phone.trim().length >= 7, "Phone number", "A phone number is present as text.", "Add a complete phone number as normal text.", 4),
    createFinding("Contact", "contact.location", isMeaningful(resume.personal.location), "Location", "A city or location is present as text.", "Add a city, region, or location.", 3),
    createFinding("Contact", "contact.links", linksAreSafe, "Readable web links", "Web links use safe HTTP or HTTPS addresses.", "Correct or remove invalid website, LinkedIn, or GitHub links.", 2),
    createFinding("Contact", "contact.icon-text", true, "Icons backed by text", "Every contact icon is accompanied by its machine-readable text value.", "Ensure contact details remain visible as text beside icons.", 2),

    createFinding("Sections", "sections.experience", visibleTypes.has("experience"), "Experience section", "A standard Experience section is visible.", "Add or show an Experience section with a standard heading.", 6),
    createFinding("Sections", "sections.skills", visibleTypes.has("skills"), "Skills section", "A standard Skills section is visible.", "Add or show a Skills section relevant to the target role.", 5),
    createFinding("Sections", "sections.education", visibleTypes.has("education"), "Education section", "A standard Education section is visible.", "Add or show an Education section.", 4),
    createFinding("Sections", "sections.headings", unclearHeadings.length === 0, "Recognizable section headings", "Visible headings use commonly recognized names.", `Consider clearer headings for: ${unclearHeadings.map((section) => section.title).join(", ")}.`, 4),
    createFinding("Sections", "sections.not-empty", emptySections.length === 0, "No empty sections", "All visible sections contain meaningful content.", `Complete or hide: ${emptySections.map((section) => section.title).join(", ")}.`, 3),

    createFinding("Content", "content.skills-count", skillCount >= 5, "Sufficient skills", `${skillCount} relevant skills are listed.`, "List at least five role-relevant skills.", 4),
    createFinding("Content", "content.experience-bullets", experienceBullets.length >= 3, "Experience detail", "Experience contains scannable achievement bullets.", "Add at least three concise bullets across your experience entries.", 4),
    createFinding("Content", "content.measurable-achievements", experienceBullets.length > 0 && quantifiedBullets.length / experienceBullets.length >= 0.2, "Measurable achievements", "Experience includes measurable outcomes.", "Add numbers, percentages, scale, time saved, or other measurable results to experience bullets.", 5),
    createFinding("Content", "content.concise", !longContent, "Concise paragraphs and bullets", "Paragraphs and bullets are reasonably concise.", "Shorten paragraphs over 500 characters, descriptions over 350, or bullets over 220.", 3),
    createFinding("Content", "content.repetition", repeatedWords.length === 0, "Limited word repetition", "No unusually repeated content words were detected.", `Review repeated words: ${repeatedWords.join(", ")}. Use natural alternatives where accurate.`, 3),
    createFinding("Content", "content.first-person", !/\b(?:i|me|my|mine|we|our|ours)\b/i.test(resumeText), "Resume-style voice", "No first-person pronouns were detected.", "Consider removing first-person pronouns such as “I”, “my”, or “we”.", 2),

    createFinding("Dates", "dates.present", dateItems.length === 0 || missingDates.length === 0, "Dates present", "Dated entries contain date information.", `Add dates to ${missingDates.length} experience, education, project, or certification entries.`, 3),
    createFinding("Dates", "dates.conventional", dateItems.length === 0 || dateStyles.every((style) => style !== "unknown" && style !== "numeric"), "Conventional date formats", "Dates use month-and-year or year-only formats.", "Use formats such as “Jan 2024 - Present” or “2024 - Present”; avoid ambiguous numeric dates.", 3),
    createFinding("Dates", "dates.consistent", !inconsistentDates, "Consistent date formatting", "Date formatting is consistent across entries.", "Use either full month names, abbreviated months, or year-only dates consistently.", 3),

    createFinding("Design", "design.font-size", resume.design.fontSize >= 10, "Readable font size", `The ${resume.design.fontSize} pt body font is readable.`, "Increase the body font to at least 10 pt.", 4),
    createFinding("Design", "design.font-family", ATS_SAFE_FONTS.includes(resume.design.fontFamily as (typeof ATS_SAFE_FONTS)[number]), "ATS-safe body font", "The selected body font is broadly compatible.", "Choose Arial, Calibri, Helvetica, Georgia, Times New Roman, or Verdana.", 3),
    createFinding("Design", "design.line-height", resume.design.lineHeight >= 1.15 && resume.design.lineHeight <= 1.5, "Readable line spacing", "Line spacing is within a readable range.", "Use line spacing between 1.15 and 1.5 for compact readability.", 2),
    createFinding("Design", "design.contrast", contrastRatio(resume.design.textColor, resume.design.paperColor) >= 4.5, "Text contrast", "Body text and page colors meet the recommended contrast ratio.", "Choose a darker text color or lighter page color.", 4),
    createFinding("Design", "design.single-column", resume.design.templateId === "classic", "Single-column layout", "The Classic template preserves a logical single-column reading order.", "Use an ATS-focused single-column template.", 6),
    createFinding("Design", "design.photo", !resume.personal.photo, "No ATS-critical photo", "The ATS layout does not depend on a profile photo.", "Consider disabling the photo for ATS submissions; requirements vary by country and employer.", 2),
    createFinding("Design", "design.page-length", estimatedPages <= 2, "Resume length guidance", `The resume is estimated at ${estimatedPages} ${estimatedPages === 1 ? "page" : "pages"}.`, `The resume is estimated at ${estimatedPages} pages. Review relevance or use more compact spacing if appropriate.`, 3),
    createFinding("Design", "design.supported-symbols", !hasUnsupportedSymbols(resumeText), "Supported characters", "No emoji, private-use glyphs, or replacement characters were detected.", "Replace emoji, private-use icons, or replacement characters with ordinary text.", 3),

    createFinding("Export", "export.selectable-text", true, "Selectable PDF text", "The ATS PDF exporter creates real selectable text instead of a screenshot.", "Use the ATS PDF exporter rather than an image export.", 5),
    createFinding("Export", "export.reading-order", true, "Logical reading order", "PDF content follows the normalized single-column section order.", "Use a single-column ATS template with ordered text flow.", 4),
    createFinding("Export", "export.no-image-text", true, "No image-based body text", "Resume body content is rendered as text and is not rasterized.", "Do not convert resume body text into an image.", 4),
    createFinding("Export", "export.pagination", true, "Multi-page pagination", "Long PDF content wraps across pages with heading and widow/orphan protection.", "Use the ATS PDF exporter so long content is paginated safely.", 3),
    createFinding("Export", "export.standard-structure", true, "Standard document structure", "PDF export avoids tables, floating text boxes, headers, and multi-column content for critical information.", "Avoid tables, text boxes, and complex columns for critical content.", 4),
  ];

  const totalWeight = checks.reduce((total, finding) => total + finding.weight, 0);
  const passedWeight = checks
    .filter((finding) => finding.status === "pass")
    .reduce((total, finding) => total + finding.weight, 0);
  const findings: AtsFinding[] = checks.map((finding) => ({
    id: finding.id,
    category: finding.category,
    status: finding.status,
    title: finding.title,
    detail: finding.detail,
  }));
  const passed = findings.filter((finding) => finding.status === "pass").length;

  return {
    score: Math.round((passedWeight / totalWeight) * 100),
    passed,
    warnings: findings.length - passed,
    estimatedPages,
    findings,
  };
}
