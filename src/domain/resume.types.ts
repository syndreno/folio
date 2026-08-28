export const RESUME_SECTION_TYPES = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "achievements",
  "volunteering",
  "publications",
  "awards",
  "interests",
  "custom",
] as const;

export type ResumeSectionType = (typeof RESUME_SECTION_TYPES)[number];

export interface ResumeMetadata {
  fileName?: string;
  resumeName?: string;
  extraFrontMatter: Record<string, unknown>;
}

export interface PersonalLink {
  id: string;
  title: string;
  url: string;
  iconUrl: string;
}

export interface PersonalDetails {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  photo: string;
  customLinks: PersonalLink[];
}

export interface ResumeSectionItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  description: string;
  bullets: string[];
}

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  title: string;
  visible: boolean;
  order: number;
  content: string;
  items: ResumeSectionItem[];
}

export type ContactIconKey = "email" | "phone" | "location" | "website" | "linkedin" | "github";

export type ContactIconUrls = Record<ContactIconKey, string>;

export type PageSize = "A4" | "LETTER";

export interface ResumeDesignSettings {
  templateId: "classic";
  accentColor: string;
  paperColor: string;
  textColor: string;
  fontFamily: string;
  headingFontFamily: string;
  fontSize: number;
  bulletSize: number;
  lineHeight: number;
  pageSize: PageSize;
  showContactIcons: boolean;
  contactIconUrls: ContactIconUrls;
}

export interface ResumeDocument {
  version: 1;
  metadata: ResumeMetadata;
  personal: PersonalDetails;
  sections: ResumeSection[];
  design: ResumeDesignSettings;
}

export interface ImportResult {
  resume: ResumeDocument;
  warnings: string[];
}
