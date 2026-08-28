import type { ResumeSectionType } from "../domain/resume.types";

export const SECTION_ALIASES: Readonly<Record<Exclude<ResumeSectionType, "custom">, readonly string[]>> = {
  summary: ["summary", "professional summary", "profile", "career summary", "about me"],
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "employment history",
    "career history",
  ],
  education: ["education", "academic background", "academic qualifications"],
  skills: ["skills", "technical skills", "core skills", "technologies", "competencies"],
  projects: ["projects", "personal projects", "professional projects", "key projects"],
  certifications: ["certifications", "certificates", "licenses and certifications"],
  languages: ["languages", "language skills"],
  achievements: ["achievements", "accomplishments"],
  volunteering: ["volunteering", "volunteer work", "community involvement"],
  publications: ["publications", "research publications"],
  awards: ["awards", "honors", "honours and awards"],
  interests: ["interests", "hobbies", "interests and activities"],
};

export function detectSectionType(title: string): ResumeSectionType {
  const normalizedTitle = title
    .replace(/^custom:\s*/i, "")
    .trim()
    .toLocaleLowerCase("en");

  for (const [type, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.includes(normalizedTitle)) {
      return type as Exclude<ResumeSectionType, "custom">;
    }
  }

  return "custom";
}
