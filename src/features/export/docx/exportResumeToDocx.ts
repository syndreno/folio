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
  VerticalAnchor,
  WidthType,
  WpsShapeRun,
  convertMillimetersToTwip,
} from "docx";
import JSZip from "jszip";
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
  dateLed = false,
): Paragraph[] {
  const headingChildren = dateLed && item.meta
    ? [
        new TextRun({ text: item.meta, bold: true, color: accentColor }),
        new TextRun("\t"),
        new TextRun({ text: item.title, bold: true }),
      ]
    : [new TextRun({ text: item.title, bold: true })];
  if (item.meta && !dateLed) {
    headingChildren.push(new TextRun({ text: `\t${item.meta}` }));
  }

  const paragraphs = [
    new Paragraph({
      children: headingChildren,
      tabStops: dateLed
        ? [{ type: "left", position: convertMillimetersToTwip(36) }]
        : [{ type: "right", position: convertMillimetersToTwip(174) }],
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
  const paperColor = resume.design.paperColor.replace("#", "");
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
    !["professional", "sidebar", "showcase", "monogram"].includes(selectedTemplate.layout),
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
  const subtleRuleColor = mixHexColors(
    resume.design.accentColor,
    resume.design.paperColor,
    0.28,
  );
  const subtleBorder = {
    color: subtleRuleColor,
    style: BorderStyle.SINGLE,
    size: 5,
    space: 0,
  };
  const emptyParagraph = () => new Paragraph({ children: [new TextRun("")] });
  const contentWidthMillimetres = pageWidth - (resume.design.pageMargin * 2);
  const createInlineItemParagraph = (items: ResumeSectionItem[]) => new Paragraph({
    children: items.flatMap((item, index) => [
      new TextRun({
        text: `${index > 0 ? "   " : ""}\u2022   `,
        color: accentColor,
        size: Math.round(resume.design.bulletSize * POINTS_TO_HALF_POINTS),
      }),
      new TextRun({ text: item.title }),
    ]),
    spacing: { after: 35, line: lineSpacing },
  });
  const createTwoColumnListParagraphs = (
    items: ResumeSectionItem[],
    tabPositionMillimetres: number,
    highlighted: boolean,
  ): Paragraph[] => Array.from({ length: Math.ceil(items.length / 2) }, (_, rowIndex) => {
    const firstItem = items[rowIndex * 2];
    const secondItem = items[rowIndex * 2 + 1];
    if (!firstItem) return emptyParagraph();
    const itemRuns = (item: ResumeSectionItem) => [
      new TextRun({
        text: "\u2022   ",
        color: accentColor,
        size: Math.round(resume.design.bulletSize * POINTS_TO_HALF_POINTS),
      }),
      new TextRun(item.title),
    ];
    return new Paragraph({
      children: [
        ...itemRuns(firstItem),
        ...(secondItem ? [new TextRun("\t"), ...itemRuns(secondItem)] : []),
      ],
      tabStops: secondItem
        ? [{ type: "left", position: convertMillimetersToTwip(tabPositionMillimetres) }]
        : undefined,
      shading: highlighted ? { fill: subtleAccent } : undefined,
      spacing: { after: 25, line: lineSpacing },
    });
  });
  const createPillParagraphs = (
    items: ResumeSectionItem[],
    variant: "chips" | "outline",
    twoColumns = false,
    tabPositionMillimetres = contentWidthMillimetres / 2,
  ): Paragraph[] => {
    const itemRun = (item: ResumeSectionItem) => {
      const naturalWidth = Math.ceil((item.title.length * 6.1) + 18);
      const width = Math.max(42, Math.min(210, naturalWidth));
      const textSize = naturalWidth > width
        ? Math.max(14, Math.floor(18 * (width / naturalWidth)))
        : 18;
      return new WpsShapeRun({
        type: "wps",
        transformation: { width, height: 20 },
        altText: {
          title: item.title,
          description: `${item.title} skill`,
          name: `Skill ${item.id}`,
        },
        outline: variant === "outline"
          ? {
              type: "solidFill",
              solidFillType: "rgb",
              value: subtleRuleColor,
              width: 9_525,
            }
          : undefined,
        solidFill: {
          type: "rgb",
          value: variant === "chips" ? subtleAccent : paperColor,
        },
        bodyProperties: {
          verticalAnchor: VerticalAnchor.CENTER,
          margins: {
            top: 0,
            right: 47_625,
            bottom: 0,
            left: 47_625,
          },
          noAutoFit: true,
        },
        children: [new Paragraph({
          children: [new TextRun({
            text: item.title,
            color: textColor,
            font: resume.design.fontFamily,
            size: textSize,
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0, line: 200 },
        })],
      });
    };
    if (twoColumns) {
      return Array.from({ length: Math.ceil(items.length / 2) }, (_, rowIndex) => {
        const firstItem = items[rowIndex * 2];
        const secondItem = items[rowIndex * 2 + 1];
        if (!firstItem) return emptyParagraph();
        return new Paragraph({
          children: [
            itemRun(firstItem),
            ...(secondItem ? [new TextRun("\t"), itemRun(secondItem)] : []),
          ],
          tabStops: secondItem
            ? [{ type: "left", position: convertMillimetersToTwip(tabPositionMillimetres) }]
            : undefined,
          spacing: { after: 45, line: Math.max(lineSpacing, 320) },
        });
      });
    }
    return [new Paragraph({
      children: items.flatMap((item, index) => [
        ...(index > 0 ? [new TextRun("  ")] : []),
        itemRun(item),
      ]),
      spacing: { after: 45, line: Math.max(lineSpacing, 320) },
    })];
  };
  const createTechSkillParagraphs = (items: ResumeSectionItem[]): Paragraph[] => (
    items.map((item, index) => {
      const proficiency = [0.72, 0.86, 0.62][index % 3] ?? 0.72;
      const trackUnits = 10;
      const filledUnits = Math.round(proficiency * trackUnits);
      return new Paragraph({
        children: [
          new TextRun(item.title),
          new TextRun("\t"),
          new TextRun({
            text: "\u00A0".repeat(filledUnits),
            shading: { fill: accentColor },
            size: 8,
          }),
          new TextRun({
            text: "\u00A0".repeat(trackUnits - filledUnits),
            shading: { fill: subtleRuleColor },
            size: 8,
          }),
        ],
        tabStops: [{
          type: "right",
          position: convertMillimetersToTwip((contentWidthMillimetres * 0.36) - 8),
        }],
        border: { bottom: subtleBorder },
        spacing: { after: 30, line: lineSpacing },
      });
    })
  );
  const createSimpleItemBlocks = (
    items: ResumeSectionItem[],
    sectionType: ResumeDocument["sections"][number]["type"],
  ): Array<Paragraph | Table> => {
    if (items.length === 0) return [];
    if (selectedTemplate.layout === "tech" && sectionType === "skills") {
      return createTechSkillParagraphs(items);
    }
    if (selectedTemplate.skillStyle === "inline") {
      return [createInlineItemParagraph(items)];
    }
    const sectionWidthFactor = selectedTemplate.layout === "editorial"
      ? 0.78
      : selectedTemplate.layout === "split"
        ? 0.72
        : usesComposedColumns && sidebarSectionTypes.has(sectionType)
          ? 0.36
          : 1;
    const tabPositionMillimetres = (contentWidthMillimetres * sectionWidthFactor) / 2;
    const highlighted = selectedTemplate.layout === "healthcare"
      && (sectionType === "skills" || sectionType === "certifications");
    if (selectedTemplate.skillStyle === "list") {
      return createTwoColumnListParagraphs(items, tabPositionMillimetres, highlighted);
    }
    const functionalGrid = selectedTemplate.layout === "functional" && sectionType === "skills";
    return createPillParagraphs(
      items,
      selectedTemplate.skillStyle,
      functionalGrid,
      tabPositionMillimetres,
    );
  };
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
  const sidebarHeader = new Table({
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
          width: { size: 42, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 140, right: 150, bottom: 140, left: 150 },
          shading: { fill: accentColor },
          verticalAlign: "center",
          children: [
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.fullName || "Your Name",
                bold: true,
                color: "FFFFFF",
                size: Math.max(44, bodySize + 22),
              })],
              keepNext: true,
              spacing: { after: 35 },
            }),
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.professionalTitle.toLocaleUpperCase("en"),
                bold: true,
                color: "FFFFFF",
                characterSpacing: 18,
              })],
            }),
          ],
        }),
        new TableCell({
          width: { size: photoRun ? 40 : 58, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 90, right: 120, bottom: 90, left: 150 },
          verticalAlign: "center",
          children: contacts.length > 0
            ? contacts.map((contact) => new Paragraph({
                children: [contactRun(contact.label, contact.href, textColor)],
                spacing: { after: 22 },
              }))
            : [emptyParagraph()],
        }),
        ...(photoRun ? [new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 60, right: 30, bottom: 60, left: 30 },
          verticalAlign: "center",
          children: [new Paragraph({ children: [photoRun], alignment: AlignmentType.CENTER })],
        })] : []),
      ],
    })],
  });
  const statementHeader = new Table({
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
          width: { size: 62, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 170, right: 160, bottom: 170, left: 170 },
          shading: { fill: techHeaderColor },
          verticalAlign: "center",
          children: [new Paragraph({
            children: [new TextRun({
              text: resume.personal.fullName || "Your Name",
              bold: true,
              color: "FFFFFF",
              size: Math.max(50, bodySize + 28),
            })],
          })],
        }),
        new TableCell({
          width: { size: 38, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 120, right: 150, bottom: 120, left: 130 },
          shading: { fill: techHeaderColor },
          verticalAlign: "center",
          children: [
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.professionalTitle.toLocaleUpperCase("en"),
                bold: true,
                color: "FFFFFF",
                characterSpacing: 18,
              })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 50 },
            }),
            ...contacts.map((contact) => new Paragraph({
              children: [contactRun(contact.label, contact.href, "FFFFFF")],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 20 },
            })),
          ],
        }),
      ],
    })],
  });
  const showcaseHeader = new Table({
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
        ...(photoRun ? [new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 70, right: 70, bottom: 70, left: 70 },
          shading: { fill: subtleAccent },
          verticalAlign: "center",
          children: [new Paragraph({ children: [photoRun], alignment: AlignmentType.CENTER })],
        })] : []),
        new TableCell({
          width: { size: photoRun ? 47 : 62, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 130, right: 150, bottom: 130, left: 150 },
          shading: { fill: subtleAccent },
          verticalAlign: "center",
          children: [
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.fullName || "Your Name",
                bold: true,
                color: textColor,
                size: Math.max(48, bodySize + 26),
              })],
              spacing: { after: 30 },
            }),
            new Paragraph({
              children: [new TextRun({
                text: resume.personal.professionalTitle.toLocaleUpperCase("en"),
                bold: true,
                color: accentColor,
                characterSpacing: 18,
              })],
            }),
          ],
        }),
        new TableCell({
          width: { size: photoRun ? 33 : 38, type: WidthType.PERCENTAGE },
          borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
          margins: { top: 100, right: 120, bottom: 100, left: 120 },
          shading: { fill: subtleAccent },
          verticalAlign: "center",
          children: contacts.length > 0
            ? contacts.map((contact) => new Paragraph({
                children: [contactRun(contact.label, contact.href, textColor)],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 22 },
              }))
            : [emptyParagraph()],
        }),
      ],
    })],
  });
  const monogramHeader: Array<Paragraph | Table> = [
    ...(photoRun ? [new Paragraph({
      children: [photoRun],
      alignment: AlignmentType.CENTER,
      spacing: { after: 55 },
    })] : []),
    new Paragraph({
      children: [new TextRun({
        text: resume.personal.fullName || "Your Name",
        bold: true,
        color: accentColor,
        size: Math.max(50, bodySize + 28),
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      keepNext: true,
    }),
    new Paragraph({
      children: [new TextRun({
        text: resume.personal.professionalTitle.toLocaleUpperCase("en"),
        bold: true,
        color: accentColor,
        characterSpacing: 18,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      keepNext: true,
    }),
    new Paragraph({
      children: contacts.flatMap((contact, index) => [
        ...(index ? [new TextRun({ text: "  |  ", color: accentColor })] : []),
        contactRun(contact.label, contact.href, textColor),
      ]),
      alignment: AlignmentType.CENTER,
      border: { bottom: doubleBorder },
      spacing: { after: 100 },
    }),
  ];
  const children: Array<Paragraph | Table> = selectedTemplate.layout === "professional"
    ? [professionalHeader]
    : selectedTemplate.layout === "tech"
      ? [techHeader]
      : selectedTemplate.layout === "sidebar"
        ? [sidebarHeader]
        : selectedTemplate.layout === "statement"
          ? [statementHeader]
          : selectedTemplate.layout === "showcase"
            ? [showcaseHeader]
            : selectedTemplate.layout === "monogram"
              ? monogramHeader
      : standardHeaderChildren;
  const usesComposedColumns = [
    "professional",
    "functional",
    "tech",
    "sidebar",
    "showcase",
    "monogram",
  ].includes(selectedTemplate.layout);
  const sidebarSectionTypes = new Set(["skills", "certifications", "languages", "interests", "awards"]);
  const summaryBlocks: Array<Paragraph | Table> = [];
  const mainBlocks: Array<Paragraph | Table> = [];
  const sidebarBlocks: Array<Paragraph | Table> = [];

  [...resume.sections]
    .filter((section) => section.visible)
    .sort((first, second) => first.order - second.order)
    .forEach((section, sectionIndex) => {
      const centeredHighlight = selectedTemplate.layout === "student"
        && (section.type === "education" || section.type === "projects");
      const sectionFill = centeredHighlight || selectedTemplate.sectionStyle === "band"
        ? subtleAccent
        : selectedTemplate.sectionStyle === "label"
          ? accentColor
          : undefined;
      const backgroundPaddingBorder = sectionFill
        ? { color: sectionFill, style: BorderStyle.SINGLE, size: 2, space: 3 }
        : undefined;
      const sectionBorder = backgroundPaddingBorder
        ? {
            top: backgroundPaddingBorder,
            right: backgroundPaddingBorder,
            bottom: backgroundPaddingBorder,
            left: backgroundPaddingBorder,
          }
        : selectedTemplate.sectionStyle === "left-rule"
          ? { left: strongBorder }
          : selectedTemplate.sectionStyle === "double-rule"
            ? { top: thinBorder, bottom: thinBorder }
            : selectedTemplate.sectionStyle === "boxed"
              ? { top: thinBorder, right: thinBorder, bottom: thinBorder, left: thinBorder }
              : selectedTemplate.sectionStyle === "plain"
                ? undefined
                : { bottom: thinBorder };
      const sectionTitle = selectedTemplate.sectionStyle === "numbered"
        ? `${String(sectionIndex + 1).padStart(2, "0")}  ${section.title}`
        : section.title;
      const sectionHeading = new Paragraph({
        children: [new TextRun({
          text: sectionFill ? `\u00A0${sectionTitle}\u00A0` : sectionTitle,
          bold: true,
          color: selectedTemplate.sectionStyle === "label"
            ? resume.design.paperColor.replace("#", "")
            : accentColor,
        })],
        heading: HeadingLevel.HEADING_1,
        keepNext: true,
        alignment: centeredHighlight
          ? AlignmentType.CENTER
          : AlignmentType.LEFT,
        border: sectionBorder,
        indent: selectedTemplate.sectionStyle === "left-rule" ? { left: 120 } : undefined,
        shading: sectionFill ? { fill: sectionFill } : undefined,
        spacing: { before: Math.round(resume.design.sectionSpacing * densityFactor * 12), after: 55 },
      });
      const sectionContent: Array<Paragraph | Table> = [];
      if (section.content) {
        if (selectedTemplate.layout === "statement" && section.type === "summary") {
          sectionContent.push(new Paragraph({
            children: [new TextRun({ text: section.content, font: resume.design.headingFontFamily })],
            shading: { fill: subtleAccent },
            border: { left: strongBorder },
            indent: { left: 140, right: 140 },
            spacing: { before: 35, after: 70, line: lineSpacing },
          }));
        } else {
          sectionContent.push(...textParagraphs(section.content, 55, lineSpacing));
        }
      }
      const simpleItems = section.items.every(
        (item) => !item.subtitle && !item.meta && !item.description && item.bullets.length === 0,
      );
      if (simpleItems) {
        sectionContent.push(...createSimpleItemBlocks(section.items, section.type));
      } else {
        section.items.forEach((item) => sectionContent.push(...entryParagraphs(
          item,
          accentColor,
          entrySpacing,
          lineSpacing,
          selectedTemplate.layout === "statement",
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
    const mainWidth = selectedTemplate.layout === "sidebar"
      ? 68
      : selectedTemplate.layout === "showcase"
        ? 63
        : selectedTemplate.layout === "monogram"
          ? 55
          : 64;
    const sidebarWidth = 100 - mainWidth;
    const mainCell = new TableCell({
      width: { size: mainWidth, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, right: noBorder, bottom: noBorder, left: noBorder },
      margins: { top: 0, right: 180, bottom: 0, left: 0 },
      children: mainBlocks.length > 0 ? mainBlocks : [emptyParagraph()],
    });
    const sidebarCell = new TableCell({
      width: { size: sidebarWidth, type: WidthType.PERCENTAGE },
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
        children: selectedTemplate.layout === "functional" || selectedTemplate.layout === "sidebar"
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
  const blob = await Packer.toBlob(buildResumeDocxDocument(resume));
  const archive = await JSZip.loadAsync(await blob.arrayBuffer());
  const documentFile = archive.file("word/document.xml");
  if (!documentFile) return blob;
  const documentXml = await documentFile.async("string");
  if (!documentXml.includes("<wps:wsp")) return blob;

  // docx emits WPS text shapes with rectangular geometry. Normalize only the
  // skill shapes after packing so Word renders true rounded, editable capsules.
  let nextSkillShapeId = 10_000;
  const roundedDocumentXml = documentXml.replace(
    /<wps:wsp(?:\s[^>]*)?>[\s\S]*?<\/wps:wsp>/g,
    (shapeXml) => shapeXml
      .replace(
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>',
        '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 50000"/></a:avLst></a:prstGeom>',
      )
      .replace(
        /<a:noFill\/>(<a:ln(?:\s[^>]*)?>[\s\S]*?<\/a:ln>)(<a:solidFill>[\s\S]*?<\/a:solidFill>)/,
        "$2$1",
      ),
  ).replace(
    /<wp:docPr id="\d+" name="Skill /g,
    (documentProperty) => documentProperty.replace(/id="\d+"/, `id="${nextSkillShapeId++}"`),
  );
  archive.file("word/document.xml", roundedDocumentXml);
  const arrayBuffer = await archive.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
  });
  return new Blob([arrayBuffer], { type: blob.type });
}

export async function exportResumeToDocx(resume: ResumeDocument, fileName: string): Promise<void> {
  downloadBlob(await buildResumeDocxBlob(resume), fileName);
}
