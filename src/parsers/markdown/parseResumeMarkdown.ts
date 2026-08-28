import YAML from "yaml";
import { CONTACT_ICON_KEYS, getFontAwesomeIconName } from "../../constants/contactIcons";
import { detectSectionType } from "../../constants/sectionAliases";
import { createBlankResume, createId } from "../../domain/resume.defaults";
import {
  emailSchema,
  frontMatterSchema,
  safeWebUrlSchema,
  supportedFontSchema,
} from "../../domain/resume.schema";
import type {
  ImportResult,
  ResumeDocument,
  ContactIconUrls,
  PersonalLink,
  ResumeSection,
  ResumeSectionItem,
} from "../../domain/resume.types";

const FRONT_MATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const RAW_HTML_PATTERN = /<[^>]*>/g;

const KNOWN_FRONT_MATTER_KEYS = new Set([
  "resume_version",
  "name",
  "title",
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
  "photo",
  "template",
  "accent_color",
  "paper_color",
  "text_color",
  "font_family",
  "heading_font_family",
  "font_size",
  "bullet_size",
  "line_height",
  "page_size",
  "section_order",
  "hidden_sections",
  "show_contact_icons",
  "contact_icons",
  "custom_links",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringValue(record: Record<string, unknown>, key: string, fallback: string): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(record: Record<string, unknown>, key: string, fallback: number): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toColorValue(record: Record<string, unknown>, key: string, fallback: string): string {
  const value = record[key];
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)
    ? value.toUpperCase()
    : fallback;
}

function parseFrontMatter(markdown: string, warnings: string[]) {
  const match = markdown.match(FRONT_MATTER_PATTERN);
  if (!match) {
    warnings.push("No YAML front matter was found. Default resume settings were applied.");
    return { body: markdown, data: {} as Record<string, unknown> };
  }

  const source = match[1] ?? "";
  let parsed: unknown;

  try {
    parsed = YAML.parse(source);
  } catch {
    warnings.push("The YAML settings could not be read. The resume content was still imported.");
    return { body: markdown.slice(match[0].length), data: {} as Record<string, unknown> };
  }

  if (!isRecord(parsed)) {
    warnings.push("The YAML settings were not an object. Default resume settings were applied.");
    return { body: markdown.slice(match[0].length), data: {} as Record<string, unknown> };
  }

  const validation = frontMatterSchema.safeParse(parsed);
  if (!validation.success) {
    warnings.push("Some design settings were outside supported values and were replaced with defaults.");
  }

  return { body: markdown.slice(match[0].length), data: parsed };
}

function cleanMarkdownText(value: string): string {
  return value
    .replace(HTML_COMMENT_PATTERN, "")
    .replace(RAW_HTML_PATTERN, "")
    .replace(/\[([^\]]+)]\((?:https?:\/\/|mailto:)[^)]+\)/g, "$1")
    .trim();
}

function stripEmphasis(value: string): string {
  return value.replace(/^\*\*(.*?)\*\*$/, "$1").replace(/^_(.*?)_$/, "$1").trim();
}

function splitEntryHeading(heading: string): { title: string; subtitle: string } {
  const parts = heading.split(/\s+(?:—|–|-|\|)\s+/, 2);
  return {
    title: parts[0]?.trim() || "Untitled entry",
    subtitle: parts[1]?.trim() ?? "",
  };
}

function createListItem(title: string): ResumeSectionItem {
  return {
    id: createId("item"),
    title,
    subtitle: "",
    meta: "",
    description: "",
    bullets: [],
  };
}

function parseEntry(heading: string, lines: string[]): ResumeSectionItem {
  const { title, subtitle } = splitEntryHeading(heading);
  const item: ResumeSectionItem = {
    id: createId("item"),
    title,
    subtitle,
    meta: "",
    description: "",
    bullets: [],
  };
  const paragraphs: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("- ")) {
      item.bullets.push(cleanMarkdownText(line.slice(2)));
    } else if (!item.meta && (/^\*\*.*\*\*$/.test(line) || /^_.*_$/.test(line))) {
      item.meta = stripEmphasis(cleanMarkdownText(line));
    } else if (!item.subtitle && paragraphs.length === 0) {
      item.subtitle = cleanMarkdownText(line.replace(/\s{2}$/, ""));
    } else {
      paragraphs.push(cleanMarkdownText(line));
    }
  }

  item.description = paragraphs.join(" ");
  return item;
}

function parseSection(title: string, lines: string[], order: number): ResumeSection {
  const type = detectSectionType(title);
  const cleanTitle = title.replace(/^custom:\s*/i, "").trim();
  const section: ResumeSection = {
    id: createId("section"),
    type,
    title: cleanTitle || "Custom Section",
    visible: true,
    order,
    content: "",
    items: [],
  };
  const hasEntries = lines.some((line) => /^##\s+/.test(line));

  if (!hasEntries) {
    const bullets = lines
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => cleanMarkdownText(line.slice(2)))
      .filter(Boolean);
    const paragraphs = lines
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("- "))
      .map(cleanMarkdownText)
      .filter(Boolean);

    if (type === "summary" || bullets.length === 0) {
      section.content = paragraphs.join("\n\n");
    }
    section.items = bullets.map(createListItem);
    return section;
  }

  let entryHeading = "";
  let entryLines: string[] = [];
  const commitEntry = () => {
    if (entryHeading) section.items.push(parseEntry(entryHeading, entryLines));
  };

  for (const line of lines) {
    const entryMatch = line.match(/^##\s+(.+)$/);
    if (entryMatch) {
      commitEntry();
      entryHeading = cleanMarkdownText(entryMatch[1] ?? "");
      entryLines = [];
    } else if (entryHeading) {
      entryLines.push(line);
    }
  }
  commitEntry();
  return section;
}

function parseSections(body: string): ResumeSection[] {
  const cleanedBody = body.replace(HTML_COMMENT_PATTERN, "");
  const lines = cleanedBody.split(/\r?\n/);
  const sections: ResumeSection[] = [];
  let title = "";
  let sectionLines: string[] = [];

  const commitSection = () => {
    if (title) sections.push(parseSection(title, sectionLines, sections.length));
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#\s+(.+)$/);
    if (headingMatch) {
      commitSection();
      title = cleanMarkdownText(headingMatch[1] ?? "");
      sectionLines = [];
    } else if (title) {
      sectionLines.push(line);
    }
  }
  commitSection();

  return sections;
}

function parseContactIconUrls(
  data: Record<string, unknown>,
  defaults: ContactIconUrls,
  warnings: string[],
): ContactIconUrls {
  const configured = data.contact_icons;
  if (!isRecord(configured)) return { ...defaults };

  const result = { ...defaults };
  for (const key of CONTACT_ICON_KEYS) {
    const value = configured[key];
    if (value === undefined) continue;
    if (typeof value === "string" && getFontAwesomeIconName(value)) {
      result[key] = value;
    } else {
      result[key] = "";
      warnings.push(
        `The ${key} icon URL is not a supported Font Awesome Free icon and was not loaded.`,
      );
    }
  }
  return result;
}

function parseCustomLinks(data: Record<string, unknown>, warnings: string[]): PersonalLink[] {
  const configured = data.custom_links;
  if (configured === undefined) return [];
  if (!Array.isArray(configured)) {
    warnings.push("Custom links must be a YAML list and were not imported.");
    return [];
  }

  if (configured.length > 20) {
    warnings.push("Only the first 20 custom links were imported.");
  }

  return configured.slice(0, 20).flatMap((candidate, index) => {
    if (!isRecord(candidate)) {
      warnings.push(`Custom link ${index + 1} was not valid and was skipped.`);
      return [];
    }

    const title = toStringValue(candidate, "title", "").trim()
      || toStringValue(candidate, "content", "").trim()
      || toStringValue(candidate, "header", "").trim();
    const url = toStringValue(candidate, "url", "").trim();
    const configuredIcon = toStringValue(candidate, "icon", "").trim();
    let iconUrl = "";

    if (configuredIcon) {
      if (getFontAwesomeIconName(configuredIcon)) {
        iconUrl = configuredIcon;
      } else {
        warnings.push(
          `The icon for custom link “${title || index + 1}” is not a supported Font Awesome Free icon.`,
        );
      }
    }
    if (url && !safeWebUrlSchema.safeParse(url).success) {
      warnings.push(
        `The URL for custom link “${title || index + 1}” is not a safe HTTP or HTTPS URL and will not be linked.`,
      );
    }
    if (!title && !url) return [];

    return [{
      id: createId("link"),
      title,
      url,
      iconUrl,
    }];
  });
}

function validateContactDetails(resume: ResumeDocument, warnings: string[]) {
  if (resume.personal.email && !emailSchema.safeParse(resume.personal.email).success) {
    warnings.push("The email address does not appear to be valid. You can continue and edit it manually.");
  }

  for (const [label, value] of [
    ["website", resume.personal.website],
    ["LinkedIn URL", resume.personal.linkedin],
    ["GitHub URL", resume.personal.github],
  ] as const) {
    if (value && !safeWebUrlSchema.safeParse(value).success) {
      warnings.push(`The ${label} is not a safe HTTP or HTTPS URL and will not be linked.`);
    }
  }
}

export function parseResumeMarkdown(markdown: string, fileName?: string): ImportResult {
  const warnings: string[] = [];
  const defaults = createBlankResume();
  const { body, data } = parseFrontMatter(markdown, warnings);
  const version = Number(data.resume_version ?? 1);

  if (version > 1) {
    warnings.push("This resume uses a newer format version. Some settings may not be supported.");
  }

  const fontCandidate = toStringValue(data, "font_family", defaults.design.fontFamily);
  const fontFamily = supportedFontSchema.safeParse(fontCandidate).success
    ? fontCandidate
    : defaults.design.fontFamily;
  if (fontCandidate !== fontFamily) {
    warnings.push(`The font “${fontCandidate}” is not supported, so Arial was selected.`);
  }
  const headingFontCandidate = toStringValue(data, "heading_font_family", defaults.design.headingFontFamily);
  const headingFontFamily = supportedFontSchema.safeParse(headingFontCandidate).success
    ? headingFontCandidate
    : defaults.design.headingFontFamily;
  if (headingFontCandidate !== headingFontFamily) {
    warnings.push(`The heading font “${headingFontCandidate}” is not supported, so Georgia was selected.`);
  }

  const extraFrontMatter = Object.fromEntries(
    Object.entries(data).filter(([key]) => !KNOWN_FRONT_MATTER_KEYS.has(key)),
  );
  const hiddenSections = Array.isArray(data.hidden_sections)
    ? data.hidden_sections.filter((value): value is string => typeof value === "string")
    : [];
  const sections = parseSections(body);

  for (const section of sections) {
    const identity = section.type === "custom" ? section.title.toLocaleLowerCase("en") : section.type;
    section.visible = !hiddenSections.some(
      (hidden) => hidden.replace(/^custom:/i, "").trim().toLocaleLowerCase("en") === identity,
    );
    if (section.type === "custom") {
      warnings.push(`“${section.title}” was imported as a custom section.`);
    }
  }

  const resume: ResumeDocument = {
    version: 1,
    metadata: {
      fileName,
      resumeName: fileName?.replace(/\.md$/i, "") ?? "Imported resume",
      extraFrontMatter,
    },
    personal: {
      fullName: toStringValue(data, "name", defaults.personal.fullName),
      professionalTitle: toStringValue(data, "title", defaults.personal.professionalTitle),
      email: toStringValue(data, "email", ""),
      phone: toStringValue(data, "phone", ""),
      location: toStringValue(data, "location", ""),
      website: toStringValue(data, "website", ""),
      linkedin: toStringValue(data, "linkedin", ""),
      github: toStringValue(data, "github", ""),
      photo: toStringValue(data, "photo", ""),
      customLinks: parseCustomLinks(data, warnings),
    },
    sections: sections.length > 0 ? sections : defaults.sections,
    design: {
      templateId: "classic",
      accentColor: toColorValue(data, "accent_color", defaults.design.accentColor),
      paperColor: toColorValue(data, "paper_color", defaults.design.paperColor),
      textColor: toColorValue(data, "text_color", defaults.design.textColor),
      fontFamily,
      headingFontFamily,
      fontSize: Math.min(14, Math.max(9, toNumberValue(data, "font_size", defaults.design.fontSize))),
      bulletSize: Math.min(12, Math.max(5, toNumberValue(data, "bullet_size", defaults.design.bulletSize))),
      lineHeight: Math.min(
        1.6,
        Math.max(1.1, toNumberValue(data, "line_height", defaults.design.lineHeight)),
      ),
      pageSize: data.page_size === "LETTER" ? "LETTER" : "A4",
      showContactIcons:
        typeof data.show_contact_icons === "boolean"
          ? data.show_contact_icons
          : defaults.design.showContactIcons,
      contactIconUrls: parseContactIconUrls(
        data,
        defaults.design.contactIconUrls,
        warnings,
      ),
    },
  };

  validateContactDetails(resume, warnings);
  return { resume, warnings };
}
