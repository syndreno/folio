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
  Table,
  TableCell,
  TableRow,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  WidthType,
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

function contactRun(label: string, href?: string, color?: string): TextRun | ExternalHyperlink {
  if (!href) return new TextRun({ text: label, color });
  return new ExternalHyperlink({
    link: href,
    children: [new TextRun({ text: label, style: "Hyperlink", color })],
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

function createProfessionalPhotoRun(
  resume: ResumeDocument,
  floating = true,
): ImageRun | null {
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
    floating: floating ? {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.MARGIN,
        align: HorizontalPositionAlign.RIGHT,
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PARAGRAPH,
        align: VerticalPositionAlign.TOP,
      },
      wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
    } : undefined,
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
  const doubleBorder = { color: accentColor, style: BorderStyle.DOUBLE, size: 10, space: 5 };
  const headerBorder = selectedTemplate.layout === "rail"
    ? { left: strongBorder }
    : selectedTemplate.layout === "functional"
      ? { left: strongBorder }
    : selectedTemplate.layout === "band"
      ? { top: strongBorder }
      : selectedTemplate.layout === "tech" || selectedTemplate.layout === "portfolio"
        ? { bottom: strongBorder }
        : selectedTemplate.layout === "healthcare"
          ? { bottom: doubleBorder }
      : selectedTemplate.layout === "boxed"
        ? { top: thinBorder, right: thinBorder, bottom: thinBorder, left: thinBorder }
        : selectedTemplate.layout === "executive"
          ? { top: strongBorder, bottom: strongBorder }
          : selectedTemplate.layout === "minimal"
            ? undefined
            : { bottom: thinBorder };
  const headerIndent = selectedTemplate.layout === "rail" || selectedTemplate.layout === "functional"
    ? { left: 150 }
    : undefined;
  const headerAlignment = selectedTemplate.layout === "centered" || selectedTemplate.layout === "student"
    ? AlignmentType.CENTER
    : AlignmentType.LEFT;
  const displayWithSans = selectedTemplate.headingTone === "sans"
    || ["band", "rail", "split", "functional", "tech", "healthcare"].includes(selectedTemplate.layout);
  const uppercaseRole = ["band", "editorial", "executive", "split", "student", "tech", "portfolio"].includes(selectedTemplate.layout);
  const techHeaderColor = mixHexColors(resume.design.accentColor, "#14201C", 0.74);
  const headerShading = selectedTemplate.layout === "tech"
    ? { fill: techHeaderColor }
    : ["band", "functional", "student"].includes(selectedTemplate.layout)
      ? { fill: subtleAccent }
      : undefined;
  const headerTextColor = selectedTemplate.layout === "tech" ? "FFFFFF" : textColor;
  const photoRun = createProfessionalPhotoRun(
    resume,
    selectedTemplate.layout !== "professional",
  );
  const contacts: Array<{ label: string; href?: string }> = [
    { label: resume.personal.email, href: resume.personal.email ? `mailto:${resume.personal.email}` : undefined },
    { label: resume.personal.phone },
    { label: resume.personal.location },
    { label: resume.personal.website, href: safeWebUrl(resume.personal.website) },
    { label: resume.personal.linkedin, href: safeWebUrl(resume.personal.linkedin) },
    { label: resume.personal.github, href: safeWebUrl(resume.personal.github) },
    ...resume.personal.customLinks.map((link) => ({ label: link.title, href: safeWebUrl(link.url) })),
  ].filter((contact) => contact.label);
  const standardHeaderChildren: Array<Paragraph | Table> = [
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
      shading: headerShading,
    }),
    new Paragraph({
      children: [new TextRun({
        text: uppercaseRole
          ? resume.personal.professionalTitle.toLocaleUpperCase("en")
          : resume.personal.professionalTitle,
        bold: true,
        color: selectedTemplate.layout === "tech"
          ? "FFFFFF"
          : selectedTemplate.layout === "band" ? textColor : accentColor,
        characterSpacing: uppercaseRole ? 18 : undefined,
      })],
      keepNext: true,
      spacing: { after: 45 },
      border: headerBorder,
      indent: headerIndent,
      alignment: headerAlignment,
      shading: headerShading,
    }),
    new Paragraph({
      children: contacts.flatMap((contact, index) => [
        ...(index ? [new TextRun({ text: "  |  ", color: headerTextColor })] : []),
        contactRun(contact.label, contact.href, headerTextColor),
      ]),
      spacing: { after: 110 },
      border: headerBorder,
      indent: headerIndent,
      alignment: headerAlignment,
      shading: headerShading,
    }),
  ];
  const noBorder = { color: "auto", style: BorderStyle.NONE, size: 0 };
  const professionalHeader = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      right: noBorder,
      bottom: strongBorder,
      left: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
    },
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: photoRun ? 42 : 54, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 80, right: 140, bottom: 100, left: 0 },
          verticalAlign: "center",
          children: [
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.fullName || "Your Name",
                color: accentColor,
                size: Math.max(48, bodySize + 26),
              })],
              keepNext: true,
              spacing: { after: 25 },
            }),
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.professionalTitle,
                bold: true,
                color: accentColor,
                size: Math.max(22, bodySize + 4),
              })],
              spacing: { after: 40 },
            }),
          ],
        }),
        ...(photoRun ? [new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 50, right: 40, bottom: 70, left: 40 },
          verticalAlign: "center",
          children: [new Paragraph({
            children: [photoRun],
            alignment: AlignmentType.CENTER,
          })],
        })] : []),
        new TableCell({
          width: { size: photoRun ? 40 : 46, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 70, right: 0, bottom: 90, left: 140 },
          verticalAlign: "center",
          children: contacts.length > 0
            ? contacts.map((contact) => new Paragraph({
              children: [contactRun(contact.label, contact.href, textColor)],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 25 },
            }))
            : [new Paragraph({ children: [new TextRun("")] })],
        }),
      ],
    })],
  });
  const techHeader = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      right: noBorder,
      bottom: strongBorder,
      left: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
    },
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 130, right: 160, bottom: 130, left: 160 },
          shading: { fill: subtleAccent },
          verticalAlign: "center",
          children: [
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.fullName || "Your Name",
                bold: true,
                color: textColor,
                size: Math.max(44, bodySize + 22),
              })],
              keepNext: true,
              spacing: { after: 30 },
            }),
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.professionalTitle,
                bold: true,
                color: accentColor,
                size: Math.max(20, bodySize + 2),
              })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 100, right: 130, bottom: 100, left: 130 },
          shading: { fill: techHeaderColor },
          verticalAlign: "center",
          children: contacts.length > 0
            ? contacts.map((contact) => new Paragraph({
              children: [contactRun(contact.label, contact.href, "FFFFFF")],
              spacing: { after: 25 },
            }))
            : [new Paragraph({ children: [new TextRun("")] })],
        }),
      ],
    })],
  });
  const children: Array<Paragraph | Table> = selectedTemplate.layout === "professional"
    ? [professionalHeader]
    : selectedTemplate.layout === "tech"
      ? [techHeader]
      : standardHeaderChildren;
  const usesComposedColumns = ["professional", "functional", "tech"].includes(selectedTemplate.layout);
  const sidebarSectionTypes = new Set(["skills", "certifications", "languages", "interests", "awards"]);
  const summaryBlocks: Array<Paragraph | Table> = [];
  const mainBlocks: Array<Paragraph | Table> = [];
  const sidebarBlocks: Array<Paragraph | Table> = [];

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
      const sectionHeading = new Paragraph({
        children: [new TextRun({
          text: sectionTitle,
          bold: true,
          color: selectedTemplate.sectionStyle === "label"
            ? resume.design.paperColor.replace("#", "")
            : accentColor,
        })],
        heading: HeadingLevel.HEADING_1,
        keepNext: true,
        alignment: selectedTemplate.layout === "student"
          && (section.type === "education" || section.type === "projects")
          ? AlignmentType.CENTER
          : AlignmentType.LEFT,
        border: sectionBorder,
        indent: selectedTemplate.sectionStyle === "left-rule" ? { left: 120 } : undefined,
        shading: selectedTemplate.layout === "student"
          && (section.type === "education" || section.type === "projects")
          ? { fill: subtleAccent }
          : selectedTemplate.sectionStyle === "band"
          ? { fill: subtleAccent }
          : selectedTemplate.sectionStyle === "label"
            ? { fill: accentColor }
            : undefined,
        spacing: { before: Math.round(resume.design.sectionSpacing * densityFactor * 12), after: 55 },
      });
      const sectionContent: Paragraph[] = [];
      if (section.content) sectionContent.push(...textParagraphs(section.content, 55, lineSpacing));
      const simpleItems = section.items.every(
        (item) => !item.subtitle && !item.meta && !item.description && item.bullets.length === 0,
      );
      if (simpleItems) {
        if (selectedTemplate.skillStyle === "inline" || selectedTemplate.skillStyle === "chips") {
          sectionContent.push(new Paragraph({
            children: section.items.flatMap((item, index) => [
              ...(index ? [new TextRun({ text: "   •   ", color: accentColor })] : []),
              new TextRun({ text: item.title, bold: selectedTemplate.skillStyle === "chips" }),
            ]),
            spacing: { after: 35, line: lineSpacing },
          }));
        } else {
          section.items.forEach((item) => {
            sectionContent.push(new Paragraph({
              children: [new TextRun(item.title)],
              bullet: { level: 0 },
              border: selectedTemplate.skillStyle === "outline" ? { bottom: thinBorder } : undefined,
              spacing: { after: 25 },
            }));
          });
        }
      } else {
        section.items.forEach((item) => sectionContent.push(...entryParagraphs(
          item,
          accentColor,
          entrySpacing,
          lineSpacing,
        )));
      }

      if (selectedTemplate.layout === "split" || selectedTemplate.layout === "editorial") {
        const titleWidth = selectedTemplate.layout === "split" ? 28 : 22;
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: noBorder,
            right: noBorder,
            bottom: noBorder,
            left: noBorder,
            insideHorizontal: noBorder,
            insideVertical: noBorder,
          },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: titleWidth, type: WidthType.PERCENTAGE },
                borders: selectedTemplate.layout === "split"
                  ? { top: noBorder, right: strongBorder, bottom: noBorder, left: noBorder }
                  : { top: noBorder, right: noBorder, bottom: thinBorder, left: noBorder },
                margins: { top: 0, right: 100, bottom: 0, left: 0 },
                children: [sectionHeading],
              }),
              new TableCell({
                width: { size: 100 - titleWidth, type: WidthType.PERCENTAGE },
                borders: {
                  top: noBorder,
                  right: noBorder,
                  bottom: noBorder,
                  left: noBorder,
                },
                margins: { top: 0, right: 0, bottom: 0, left: 180 },
                children: sectionContent.length > 0
                  ? sectionContent
                  : [new Paragraph({ children: [new TextRun("")] })],
              }),
            ],
          })],
        }));
      } else if (usesComposedColumns) {
        const target = section.type === "summary"
          ? summaryBlocks
          : sidebarSectionTypes.has(section.type)
            ? sidebarBlocks
            : mainBlocks;
        target.push(sectionHeading, ...sectionContent);
      } else {
        children.push(sectionHeading, ...sectionContent);
      }
    });

  if (usesComposedColumns) {
    children.push(...summaryBlocks);
    const emptyParagraph = () => new Paragraph({ children: [new TextRun("")] });
    const mainCell = new TableCell({
      width: { size: 64, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
      margins: { top: 0, right: 180, bottom: 0, left: 0 },
      children: mainBlocks.length > 0 ? mainBlocks : [emptyParagraph()],
    });
    const sidebarCell = new TableCell({
      width: { size: 36, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
      margins: { top: 50, right: 120, bottom: 100, left: 120 },
      shading: { fill: subtleAccent },
      children: sidebarBlocks.length > 0 ? sidebarBlocks : [emptyParagraph()],
    });
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: noBorder,
        right: noBorder,
        bottom: noBorder,
        left: noBorder,
        insideHorizontal: noBorder,
        insideVertical: noBorder,
      },
      rows: [new TableRow({
        children: selectedTemplate.layout === "functional"
          ? [sidebarCell, mainCell]
          : [mainCell, sidebarCell],
      })],
    }));
  }

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
            size: ["editorial", "portfolio"].includes(selectedTemplate.layout)
              ? Math.max(46, bodySize + 24)
              : displayWithSans
                ? Math.max(40, bodySize + 20)
                : Math.max(36, bodySize + 18),
            bold: true,
            color: selectedTemplate.layout === "tech"
              ? "FFFFFF"
              : ["band", "rail", "split", "functional", "healthcare"].includes(selectedTemplate.layout) ? accentColor : textColor,
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
