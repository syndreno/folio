import YAML from "yaml";
import type { ResumeDocument, ResumeSection, ResumeSectionItem } from "../../domain/resume.types";

const SIMPLE_LIST_TYPES = new Set([
  "skills",
  "certifications",
  "languages",
  "achievements",
  "awards",
  "interests",
]);

function sectionIdentity(section: ResumeSection): string {
  return section.type === "custom" ? `custom:${section.title}` : section.type;
}

function serializeEntry(item: ResumeSectionItem): string {
  const heading = item.subtitle ? `${item.title} — ${item.subtitle}` : item.title;
  const lines = [`## ${heading}`];
  if (item.meta) lines.push("", `**${item.meta}**`);
  if (item.description) lines.push("", item.description);
  if (item.bullets.length > 0) lines.push("", ...item.bullets.map((bullet) => `- ${bullet}`));
  return lines.join("\n");
}

function serializeSection(section: ResumeSection): string {
  const heading = section.type === "custom" ? `# Custom: ${section.title}` : `# ${section.title}`;
  if (section.type === "summary" || (section.content && section.items.length === 0)) {
    return `${heading}\n\n${section.content}`.trimEnd();
  }

  const simpleList = SIMPLE_LIST_TYPES.has(section.type) ||
    section.items.every(
      (item) => !item.subtitle && !item.meta && !item.description && item.bullets.length === 0,
    );
  const content = simpleList
    ? section.items.map((item) => `- ${item.title}`).join("\n")
    : section.items.map(serializeEntry).join("\n\n");
  return `${heading}\n\n${content}`.trimEnd();
}

export function serializeResumeMarkdown(resume: ResumeDocument): string {
  const orderedSections = [...resume.sections].sort((a, b) => a.order - b.order);
  const frontMatter = {
    ...resume.metadata.extraFrontMatter,
    resume_version: 1,
    name: resume.personal.fullName,
    title: resume.personal.professionalTitle,
    email: resume.personal.email,
    phone: resume.personal.phone,
    location: resume.personal.location,
    website: resume.personal.website,
    linkedin: resume.personal.linkedin,
    github: resume.personal.github,
    custom_links: resume.personal.customLinks.map((link) => ({
      header: link.header,
      content: link.content,
      url: link.url,
      icon: link.iconUrl,
    })),
    template: resume.design.templateId,
    accent_color: resume.design.accentColor,
    paper_color: resume.design.paperColor,
    text_color: resume.design.textColor,
    font_family: resume.design.fontFamily,
    heading_font_family: resume.design.headingFontFamily,
    font_size: resume.design.fontSize,
    bullet_size: resume.design.bulletSize,
    line_height: resume.design.lineHeight,
    page_size: resume.design.pageSize,
    photo: resume.personal.photo,
    section_order: orderedSections.map(sectionIdentity),
    hidden_sections: orderedSections.filter((section) => !section.visible).map(sectionIdentity),
    show_contact_icons: resume.design.showContactIcons,
    contact_icons: resume.design.contactIconUrls,
  };
  const yaml = YAML.stringify(frontMatter, { lineWidth: 0 }).trimEnd();
  const body = orderedSections.map(serializeSection).join("\n\n");
  return `---\n${yaml}\n---\n\n${body}\n`;
}
