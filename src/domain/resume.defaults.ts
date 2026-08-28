import type {
  ResumeDocument,
  PersonalLink,
  ResumeSection,
  ResumeSectionItem,
  ResumeSectionType,
} from "./resume.types";
import { DEFAULT_CONTACT_ICON_URLS } from "../constants/contactIcons";

export const ATS_SAFE_FONTS = [
  "Arial",
  "Calibri",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Verdana",
] as const;

export const DEFAULT_ACCENT_COLOR = "#1F4E79";
export const DEFAULT_PAPER_COLOR = "#FFFFFF";
export const DEFAULT_TEXT_COLOR = "#1F2933";

export function createId(prefix: string): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${suffix}`;
}

export function createEmptyItem(): ResumeSectionItem {
  return {
    id: createId("item"),
    title: "New entry",
    subtitle: "",
    meta: "",
    description: "",
    bullets: [],
  };
}

export function createPersonalLink(): PersonalLink {
  return {
    id: createId("link"),
    header: "Portfolio",
    content: "portfolio.example.com",
    url: "https://portfolio.example.com",
    iconUrl: "https://fontawesome.com/icons/link?f=classic&s=solid",
  };
}

export function createSection(
  type: ResumeSectionType,
  title: string,
  order: number,
): ResumeSection {
  return {
    id: createId("section"),
    type,
    title,
    visible: true,
    order,
    content: type === "summary" ? "Write a concise professional summary here." : "",
    items: type === "summary" ? [] : [createEmptyItem()],
  };
}

export function createBlankResume(): ResumeDocument {
  return {
    version: 1,
    metadata: {
      resumeName: "Untitled resume",
      extraFrontMatter: {},
    },
    personal: {
      fullName: "Your Name",
      professionalTitle: "Your Professional Title",
      email: "you@example.com",
      phone: "+00 00000 00000",
      location: "City, Country",
      website: "",
      linkedin: "",
      github: "",
      photo: "",
      customLinks: [],
    },
    sections: [
      createSection("summary", "Professional Summary", 0),
      createSection("experience", "Experience", 1),
      createSection("skills", "Skills", 2),
      createSection("education", "Education", 3),
      createSection("projects", "Projects", 4),
    ],
    design: {
      templateId: "classic",
      accentColor: DEFAULT_ACCENT_COLOR,
      paperColor: DEFAULT_PAPER_COLOR,
      textColor: DEFAULT_TEXT_COLOR,
      fontFamily: "Arial",
      headingFontFamily: "Georgia",
      fontSize: 10.5,
      bulletSize: 8,
      lineHeight: 1.25,
      pageSize: "A4",
      showContactIcons: true,
      contactIconUrls: { ...DEFAULT_CONTACT_ICON_URLS },
    },
  };
}
