import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  TextWrappingSide,
  TextWrappingType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  convertMillimetersToTwip,
} from "docx";
import {
  getResumeTemplate,
  getTemplateDensityFactor,
} from "../../../constants/resumeTemplates";
import type { ResumeDocument, ResumeSectionItem } from "../../../domain/resume.types";
import { downloadBlob } from "../../../utils/files";

const POINTS_TO_HALF_POINTS = 2;

function mixHexColors(foreground: string, background: string, foregroundRatio: number): string {
  const foregroundValue = Number.parseInt(foreground.replace("#", ""), 16);
  const backgroundValue = Number.parseInt(background.replace("#", ""), 16);
  const channel = (shift: number) => Math.round(
    ((foregroundValue >> shift) & 0xff) * foregroundRatio
      + ((backgroundValue >> shift) & 0xff) * (1 - foregroundRatio),
  );
  return [channel(16), channel(8), channel(0)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function safeWebUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function contactRun(label: string, href?: string): TextRun | ExternalHyperlink {
  if (!href) return new TextRun(label);
  return new ExternalHyperlink({
    link: href,
    children: [new TextRun({ text: label, style: "Hyperlink" })],
  });
}

function textParagraphs(text: string, spacingAfter: number, lineSpacing: number): Paragraph[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => new Paragraph({
      children: [new TextRun(line)],
      spacing: { after: spacingAfter, line: lineSpacing },
    }));
}

function entryParagraphs(
  item: ResumeSectionItem,
  accentColor: string,
  entrySpacing: number,
  lineSpacing: number,
): Paragraph[] {
  const headingChildren = [new TextRun({ text: item.title, bold: true })];
  if (item.meta) {
    headingChildren.push(new TextRun({ text: `\t${item.meta}` }));
  }

  const paragraphs = [
    new Paragraph({
      children: headingChildren,
      tabStops: [{ type: "right", position: convertMillimetersToTwip(174) }],
      keepNext: Boolean(item.subtitle || item.description || item.bullets.length),
      spacing: { before: entrySpacing, after: 20 },
    }),
  ];

  if (item.subtitle) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: item.subtitle, bold: true, color: accentColor })],
      spacing: { after: 35 },
      keepNext: Boolean(item.description || item.bullets.length),
    }));
  }
  if (item.description) paragraphs.push(...textParagraphs(item.description, 45, lineSpacing));
  item.bullets.filter(Boolean).forEach((bullet) => {
    paragraphs.push(new Paragraph({
      children: [new TextRun(bullet)],
      bullet: { level: 0 },
      spacing: { after: 25, line: lineSpacing },
    }));
  });
  return paragraphs;
}

function createProfessionalPhotoRun(resume: ResumeDocument): ImageRun | null {
  const selectedTemplate = getResumeTemplate(resume.design.templateId);
  if (
    !selectedTemplate.supportsPhoto
    || !resume.design.showPhoto
    || !resume.personal.photo
  ) return null;

  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/i.exec(resume.personal.photo);
  if (!match?.[1] || !match[2]) return null;
  const binary = atob(match[2]);
  const data = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new ImageRun({
    type: match[1].toLocaleLowerCase("en") === "png" ? "png" : "jpg",
    data,
    transformation: { width: 76, height: 76 },
    altText: { title: "Profile photo", description: "Decorative profile photo", name: "Profile photo" },
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.MARGIN,
        align: HorizontalPositionAlign.RIGHT,
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PARAGRAPH,
        align: VerticalPositionAlign.TOP,
      },
      wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
    },
  });
}

export function buildResumeDocxDocument(resume: ResumeDocument): Document {
  const selectedTemplate = getResumeTemplate(resume.design.templateId);
  const densityFactor = getTemplateDensityFactor(selectedTemplate.density);
  const accentColor = resume.design.accentColor.replace("#", "");
  const textColor = resume.design.textColor.replace("#", "");
  const subtleAccent = mixHexColors(
    resume.design.accentColor,
    resume.design.paperColor,
    0.1,
  );
  const bodySize = Math.round(resume.design.fontSize * POINTS_TO_HALF_POINTS);
  const headingSize = Math.round(resume.design.headingSize * POINTS_TO_HALF_POINTS);
  const pageWidth = resume.design.pageSize === "LETTER" ? 215.9 : 210;
  const pageHeight = resume.design.pageSize === "LETTER" ? 279.4 : 297;
  const margin = convertMillimetersToTwip(resume.design.pageMargin);
  const lineSpacing = Math.round(240 * resume.design.lineHeight);
  const entrySpacing = Math.round(resume.design.entrySpacing * densityFactor * 12);
  const thinBorder = { color: accentColor, style: BorderStyle.SINGLE, size: 7, space: 5 };
  const strongBorder = { color: accentColor, style: BorderStyle.SINGLE, size: 16, space: 7 };
  const headerBorder = selectedTemplate.layout === "rail"
    ? { left: strongBorder }
    : selectedTemplate.layout === "band"
      ? { top: strongBorder }
      : selectedTemplate.layout === "boxed"
        ? { top: thinBorder, right: thinBorder, bottom: thinBorder, left: thinBorder }
        : selectedTemplate.layout === "executive"
          ? { top: strongBorder, bottom: strongBorder }
          : selectedTemplate.layout === "minimal"
            ? undefined
            : { bottom: thinBorder };
  const headerIndent = selectedTemplate.layout === "rail" ? { left: 150 } : undefined;
  const headerAlignment = selectedTemplate.layout === "centered"
    ? AlignmentType.CENTER
    : AlignmentType.LEFT;
  const displayWithSans = selectedTemplate.headingTone === "sans"
    || ["band", "rail", "split"].includes(selectedTemplate.layout);
  const uppercaseRole = ["band", "editorial", "executive", "split"].includes(selectedTemplate.layout);
  const photoRun = createProfessionalPhotoRun(resume);
  const contacts: Array<{ label: string; href?: string }> = [
    { label: resume.personal.email, href: resume.personal.email ? `mailto:${resume.personal.email}` : undefined },
    { label: resume.personal.phone },
    { label: resume.personal.location },
    { label: resume.personal.website, href: safeWebUrl(resume.personal.website) },
    { label: resume.personal.linkedin, href: safeWebUrl(resume.personal.linkedin) },
    { label: resume.personal.github, href: safeWebUrl(resume.personal.github) },
    ...resume.personal.customLinks.map((link) => ({ label: link.title, href: safeWebUrl(link.url) })),
  ].filter((contact) => contact.label);
  const children: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun(resume.personal.fullName || "Your Name"),
        ...(photoRun ? [photoRun] : []),
      ],
      heading: HeadingLevel.TITLE,
      keepNext: true,
      spacing: { after: 30 },
      border: headerBorder,
      indent: headerIndent,
      alignment: headerAlignment,
    }),
    new Paragraph({
      children: [new TextRun({
        text: uppercaseRole
          ? resume.personal.professionalTitle.toLocaleUpperCase("en")
          : resume.personal.professionalTitle,
        bold: true,
        color: selectedTemplate.layout === "band" ? textColor : accentColor,
        characterSpacing: uppercaseRole ? 18 : undefined,
      })],
      keepNext: true,
      spacing: { after: 45 },
      border: headerBorder,
      indent: headerIndent,
      alignment: headerAlignment,
    }),
    new Paragraph({
      children: contacts.flatMap((contact, index) => [
        ...(index ? [new TextRun("  |  ")] : []),
        contactRun(contact.label, contact.href),
      ]),
      spacing: { after: 110 },
      border: headerBorder,
      indent: headerIndent,
      alignment: headerAlignment,
    }),
  ];

  [...resume.sections]
    .filter((section) => section.visible)
    .sort((first, second) => first.order - second.order)
    .forEach((section, sectionIndex) => {
      const sectionBorder = selectedTemplate.sectionStyle === "left-rule"
        ? { left: strongBorder }
        : selectedTemplate.sectionStyle === "double-rule"
          ? { top: thinBorder, bottom: thinBorder }
          : selectedTemplate.sectionStyle === "boxed"
            ? { top: thinBorder, right: thinBorder, bottom: thinBorder, left: thinBorder }
            : selectedTemplate.sectionStyle === "plain" || selectedTemplate.sectionStyle === "label"
              ? undefined
              : { bottom: thinBorder };
      const sectionTitle = selectedTemplate.sectionStyle === "numbered"
        ? `${String(sectionIndex + 1).padStart(2, "0")}  ${section.title}`
        : section.title;
      children.push(new Paragraph({
        children: [new TextRun({
          text: sectionTitle,
          bold: true,
          color: selectedTemplate.sectionStyle === "label"
            ? resume.design.paperColor.replace("#", "")
            : accentColor,
        })],
        heading: HeadingLevel.HEADING_1,
        keepNext: true,
        border: sectionBorder,
        indent: selectedTemplate.sectionStyle === "left-rule" ? { left: 120 } : undefined,
        shading: selectedTemplate.sectionStyle === "band"
          ? { fill: subtleAccent }
          : selectedTemplate.sectionStyle === "label"
            ? { fill: accentColor }
            : undefined,
        spacing: { before: Math.round(resume.design.sectionSpacing * densityFactor * 12), after: 55 },
      }));
      if (section.content) children.push(...textParagraphs(section.content, 55, lineSpacing));
      const simpleItems = section.items.every(
        (item) => !item.subtitle && !item.meta && !item.description && item.bullets.length === 0,
      );
      if (simpleItems) {
        if (selectedTemplate.skillStyle === "inline" || selectedTemplate.skillStyle === "chips") {
          children.push(new Paragraph({
            children: section.items.flatMap((item, index) => [
              ...(index ? [new TextRun({ text: "   •   ", color: accentColor })] : []),
              new TextRun({ text: item.title, bold: selectedTemplate.skillStyle === "chips" }),
            ]),
            spacing: { after: 35, line: lineSpacing },
          }));
        } else {
          section.items.forEach((item) => {
            children.push(new Paragraph({
              children: [new TextRun(item.title)],
              bullet: { level: 0 },
              border: selectedTemplate.skillStyle === "outline" ? { bottom: thinBorder } : undefined,
              spacing: { after: 25 },
            }));
          });
        }
      } else {
        section.items.forEach((item) => children.push(...entryParagraphs(
          item,
          accentColor,
          entrySpacing,
          lineSpacing,
        )));
      }
    });

  return new Document({
    background: { color: resume.design.paperColor.replace("#", "") },
    creator: resume.personal.fullName,
    title: `${resume.personal.fullName || "Resume"} Resume`,
    description: "Editable ATS-friendly resume",
    styles: {
      default: {
        document: {
          run: {
            font: resume.design.fontFamily,
            size: bodySize,
            color: textColor,
            characterSpacing: Math.round(resume.design.letterSpacing * 20),
          },
          paragraph: { spacing: { line: lineSpacing } },
        },
        title: {
          run: {
            font: displayWithSans ? resume.design.fontFamily : resume.design.headingFontFamily,
            size: selectedTemplate.layout === "editorial"
              ? Math.max(46, bodySize + 24)
              : displayWithSans
                ? Math.max(40, bodySize + 20)
                : Math.max(36, bodySize + 18),
            bold: true,
            color: ["band", "rail", "split"].includes(selectedTemplate.layout) ? accentColor : textColor,
          },
          paragraph: { spacing: { after: 30 } },
        },
        heading1: {
          run: {
            font: selectedTemplate.headingTone === "sans"
              ? resume.design.fontFamily
              : resume.design.headingFontFamily,
            size: headingSize,
            bold: true,
            color: accentColor,
            allCaps: true,
          },
          paragraph: { spacing: { before: 130, after: 55 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: {
            width: convertMillimetersToTwip(pageWidth),
            height: convertMillimetersToTwip(pageHeight),
          },
          margin: { top: margin, right: margin, bottom: margin, left: margin },
        },
      },
      children,
    }],
  });
}

export async function buildResumeDocxBlob(resume: ResumeDocument): Promise<Blob> {
  return Packer.toBlob(buildResumeDocxDocument(resume));
}

export async function exportResumeToDocx(resume: ResumeDocument, fileName: string): Promise<void> {
  downloadBlob(await buildResumeDocxBlob(resume), fileName);
}
