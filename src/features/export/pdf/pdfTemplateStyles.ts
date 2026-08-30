import { StyleSheet } from "@react-pdf/renderer";
import {
  getResumeTemplate,
} from "../../../constants/resumeTemplates";
import type { ResumeDocument } from "../../../domain/resume.types";

const CSS_PIXELS_TO_POINTS = 0.75;
export const MILLIMETRES_TO_POINTS = 2.83465;

export function pdfFontFamily(fontFamily: string): string {
  return fontFamily === "Georgia" || fontFamily === "Times New Roman" ? "Times-Roman" : "Helvetica";
}

function mixHexColors(foreground: string, background: string, foregroundRatio: number): string {
  const foregroundMatch = /^#([0-9A-Fa-f]{6})$/.exec(foreground);
  const backgroundMatch = /^#([0-9A-Fa-f]{6})$/.exec(background);
  if (!foregroundMatch?.[1] || !backgroundMatch?.[1]) return foreground;

  const foregroundValue = Number.parseInt(foregroundMatch[1], 16);
  const backgroundValue = Number.parseInt(backgroundMatch[1], 16);
  const channel = (shift: number) => Math.round(
    ((foregroundValue >> shift) & 0xff) * foregroundRatio
      + ((backgroundValue >> shift) & 0xff) * (1 - foregroundRatio),
  );
  return `#${[channel(16), channel(8), channel(0)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function createPdfTemplateStyles(resume: ResumeDocument) {
  const template = getResumeTemplate(resume.design.templateId);
  const bodyFont = pdfFontFamily(resume.design.fontFamily);
  const headingFont = pdfFontFamily(resume.design.headingFontFamily);
  const selectedHeadingFont = template.headingTone === "sans" ? bodyFont : headingFont;
  const showPhoto = template.supportsPhoto
    && resume.design.showPhoto
    && /^data:image\/(?:png|jpeg);base64,/i.test(resume.personal.photo);
  const subtleRule = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.3);
  const subtleFill = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.09);
  const headerFill = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.07);
  const pillBorder = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.38);
  const photoSpace = showPhoto
    ? (28 * MILLIMETRES_TO_POINTS) + (24 * CSS_PIXELS_TO_POINTS)
    : undefined;

  const header = (() => {
    const photoSettings = {
      minHeight: showPhoto ? (28 * MILLIMETRES_TO_POINTS) + 18.75 : undefined,
      paddingRight: photoSpace,
    };
    switch (template.layout) {
      case "minimal":
        return { ...photoSettings, paddingBottom: 5.25 };
      case "centered":
        return {
          ...photoSettings,
          paddingBottom: 9,
          borderBottomWidth: 1.5,
          borderBottomColor: resume.design.accentColor,
          alignItems: "center" as const,
        };
      case "band":
        return {
          ...photoSettings,
          paddingTop: 9,
          paddingRight: photoSpace ?? 10.5,
          paddingBottom: 9.75,
          paddingLeft: 10.5,
          backgroundColor: headerFill,
          borderTopWidth: 3,
          borderTopColor: resume.design.accentColor,
        };
      case "rail":
        return {
          ...photoSettings,
          paddingBottom: 8.25,
          paddingLeft: 9.75,
          borderLeftWidth: 3,
          borderLeftColor: resume.design.accentColor,
        };
      case "boxed":
        return {
          ...photoSettings,
          paddingTop: 8.25,
          paddingRight: photoSpace ?? 9.75,
          paddingBottom: 8.25,
          paddingLeft: 9.75,
          borderWidth: 0.75,
          borderColor: subtleRule,
        };
      case "split":
        return {
          ...photoSettings,
          paddingBottom: 9,
          borderBottomWidth: 1.5,
          borderBottomColor: resume.design.accentColor,
        };
      case "editorial":
        return {
          ...photoSettings,
          paddingBottom: 9,
          borderBottomWidth: 0.75,
          borderBottomColor: subtleRule,
        };
      case "executive":
        return {
          ...photoSettings,
          paddingTop: 7.5,
          paddingBottom: 7.5,
          borderTopWidth: 1.5,
          borderTopColor: resume.design.accentColor,
          borderBottomWidth: 1.5,
          borderBottomColor: resume.design.accentColor,
        };
      case "functional":
        return {
          ...photoSettings,
          paddingTop: 8.25,
          paddingRight: photoSpace ?? 10.5,
          paddingBottom: 8.25,
          paddingLeft: 10.5,
          backgroundColor: subtleFill,
          borderLeftWidth: 3.75,
          borderLeftColor: resume.design.accentColor,
        };
      case "student":
        return {
          ...photoSettings,
          paddingTop: 9,
          paddingRight: photoSpace ?? 9,
          paddingBottom: 9,
          paddingLeft: 9,
          backgroundColor: subtleFill,
          alignItems: "center" as const,
        };
      case "tech":
        return {
          ...photoSettings,
          paddingTop: 9.75,
          paddingRight: photoSpace ?? 11.25,
          paddingBottom: 9.75,
          paddingLeft: 11.25,
          backgroundColor: mixHexColors(resume.design.accentColor, "#14201C", 0.74),
          borderBottomWidth: 3,
          borderBottomColor: resume.design.accentColor,
        };
      case "portfolio":
        return {
          ...photoSettings,
          paddingBottom: 9.75,
          borderBottomWidth: 3.75,
          borderBottomColor: resume.design.accentColor,
        };
      case "healthcare":
        return {
          ...photoSettings,
          paddingBottom: 8.25,
          borderBottomWidth: 2.25,
          borderBottomColor: resume.design.accentColor,
        };
      case "professional":
        return {
          ...photoSettings,
          minHeight: showPhoto ? (31 * MILLIMETRES_TO_POINTS) + 15 : undefined,
          paddingRight: showPhoto ? (31 * MILLIMETRES_TO_POINTS) + 18 : 0,
          paddingBottom: 9.75,
          borderBottomWidth: 1.5,
          borderBottomColor: resume.design.accentColor,
        };
      default:
        return {
          ...photoSettings,
          paddingBottom: 9,
          borderBottomWidth: 1.5,
          borderBottomColor: resume.design.accentColor,
        };
    }
  })();

  const sectionTitle = (() => {
    const base = {
      marginBottom: 5.25,
      color: resume.design.accentColor,
      fontFamily: selectedHeadingFont,
      fontSize: resume.design.headingSize,
      fontWeight: 700 as const,
      lineHeight: 1.1,
      letterSpacing: resume.design.headingSize * 0.09,
      textTransform: "uppercase" as const,
    };
    switch (template.sectionStyle) {
      case "plain": return base;
      case "left-rule": return { ...base, paddingTop: 1.5, paddingBottom: 1.5, paddingLeft: 6, borderLeftWidth: 2.25, borderLeftColor: resume.design.accentColor };
      case "band": return { ...base, paddingTop: 3, paddingRight: 5.25, paddingBottom: 3, paddingLeft: 5.25, backgroundColor: subtleFill };
      case "double-rule": return { ...base, paddingTop: 3, paddingBottom: 3, borderTopWidth: 0.75, borderTopColor: resume.design.accentColor, borderBottomWidth: 0.75, borderBottomColor: resume.design.accentColor };
      case "label": return { ...base, alignSelf: "flex-start" as const, paddingTop: 3, paddingRight: 6, paddingBottom: 3, paddingLeft: 6, color: resume.design.paperColor, backgroundColor: resume.design.accentColor };
      case "boxed": return { ...base, paddingTop: 3, paddingRight: 5.25, paddingBottom: 3, paddingLeft: 5.25, borderWidth: 0.75, borderColor: subtleRule };
      case "numbered": return { ...base, paddingBottom: 2.25, borderBottomWidth: 0.75, borderBottomColor: subtleRule };
      default: return { ...base, paddingBottom: 2.25, borderBottomWidth: 0.75, borderBottomColor: subtleRule };
    }
  })();

  const nameCentered = template.layout === "centered" || template.layout === "student";
  const sansDisplay = template.headingTone === "sans" || ["band", "rail", "split", "functional", "tech", "healthcare"].includes(template.layout);
  const nameSize = ["editorial", "portfolio", "professional"].includes(template.layout)
    ? 29
    : template.layout === "minimal"
      ? 23
      : 25;
  const sectionComposition = (() => {
    if (template.layout === "split") {
      return {
        section: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 19.8 },
        title: {
          ...sectionTitle,
          width: 87.8,
          flexShrink: 0,
          paddingRight: 6,
          paddingBottom: 4.5,
          borderRightWidth: 1.5,
          borderRightColor: resume.design.accentColor,
          borderBottomWidth: 0,
        },
        content: { flexGrow: 1, flexBasis: 0 },
      };
    }
    if (template.layout === "editorial") {
      return {
        section: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 17 },
        title: {
          ...sectionTitle,
          width: 68,
          flexShrink: 0,
          paddingBottom: 5.25,
          borderBottomWidth: 0.75,
          borderBottomColor: resume.design.accentColor,
        },
        content: { flexGrow: 1, flexBasis: 0 },
      };
    }
    return {
      section: {},
      title: sectionTitle,
      content: {},
    };
  })();

  return StyleSheet.create({
    header,
    contacts: nameCentered ? { justifyContent: "center" } : {},
    name: {
      color: template.layout === "tech"
        ? "#FFFFFF"
        : ["band", "rail", "split", "functional", "healthcare", "professional"].includes(template.layout)
          ? resume.design.accentColor
          : resume.design.textColor,
      fontFamily: sansDisplay ? bodyFont : selectedHeadingFont,
      fontSize: nameSize,
      fontWeight: template.layout === "professional" ? 400 : sansDisplay ? 800 : 500,
      lineHeight: 1.05,
      letterSpacing: template.layout === "editorial" ? -0.9 : -0.5,
      textAlign: nameCentered ? "center" : "left",
    },
    role: {
      marginTop: 3.75,
      marginBottom: 6,
      color: template.layout === "tech"
        ? "#FFFFFF"
        : template.layout === "band" ? resume.design.textColor : resume.design.accentColor,
      fontSize: ["band", "editorial", "executive", "split", "functional", "student", "tech", "portfolio"].includes(template.layout) ? 9.5 : template.layout === "professional" ? 12 : 11,
      fontWeight: 700,
      letterSpacing: ["band", "editorial", "executive", "split", "student", "tech", "portfolio"].includes(template.layout) ? 0.9 : 0.44,
      textTransform: ["band", "editorial", "executive", "split", "student", "tech", "portfolio"].includes(template.layout) ? "uppercase" : "none",
      textAlign: nameCentered ? "center" : "left",
    },
    section: sectionComposition.section,
    sectionTitle: sectionComposition.title,
    sectionContent: sectionComposition.content,
    highlightedSectionContent: {
      paddingTop: 6,
      paddingRight: 7.5,
      paddingBottom: 6,
      paddingLeft: 7.5,
      backgroundColor: subtleFill,
      borderLeftWidth: 2.25,
      borderLeftColor: resume.design.accentColor,
    },
    centeredSectionTitle: {
      ...sectionComposition.title,
      paddingTop: 3.75,
      paddingBottom: 3.75,
      backgroundColor: subtleFill,
      borderBottomWidth: 0,
      textAlign: "center" as const,
    },
    summary: template.layout === "executive"
      ? {
          paddingTop: 6.75,
          paddingRight: 9,
          paddingBottom: 6.75,
          paddingLeft: 9,
          backgroundColor: subtleFill,
          borderLeftWidth: 2.25,
          borderLeftColor: resume.design.accentColor,
        }
      : {},
    simpleItem: template.skillStyle === "outline"
      ? { color: resume.design.textColor, backgroundColor: resume.design.paperColor, borderWidth: 0.75, borderColor: pillBorder, borderRadius: 7.5 }
      : template.skillStyle === "inline" || template.skillStyle === "list"
        ? { color: resume.design.textColor, backgroundColor: resume.design.paperColor, paddingLeft: 0, paddingRight: 4.5 }
        : { color: resume.design.textColor, backgroundColor: subtleFill, borderRadius: 2.25 },
    photoFrame: {
      position: "absolute",
      top: ["band", "boxed"].includes(template.layout) ? 9 : 0,
      right: ["band", "boxed"].includes(template.layout) ? 10.5 : 0,
      width: (template.layout === "professional" ? 31 : 28) * MILLIMETRES_TO_POINTS,
      height: (template.layout === "professional" ? 31 : 28) * MILLIMETRES_TO_POINTS,
      overflow: "hidden",
      borderWidth: 1.5,
      borderColor: resume.design.accentColor,
      borderRadius:
        resume.design.photoShape === "circle"
          ? (template.layout === "professional" ? 15.5 : 14) * MILLIMETRES_TO_POINTS
          : resume.design.photoShape === "rounded"
            ? 5 * MILLIMETRES_TO_POINTS
            : 0,
    },
    photo: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPositionX: `${resume.design.photoPositionX}%`,
      objectPositionY: `${resume.design.photoPositionY}%`,
      transform: `scale(${resume.design.photoZoom})`,
    },
  });
}
