import { StyleSheet } from "@react-pdf/renderer";
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
  const bodyFont = pdfFontFamily(resume.design.fontFamily);
  const headingFont = pdfFontFamily(resume.design.headingFontFamily);
  const modernTemplate = resume.design.templateId === "modern";
  const professionalTemplate = resume.design.templateId === "professional";
  const showPhoto = professionalTemplate
    && resume.design.showPhoto
    && /^data:image\/(?:png|jpeg);base64,/i.test(resume.personal.photo);
  const subtleRule = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.3);
  const subtleFill = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.09);
  const modernHeaderFill = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.06);
  const professionalHeaderFill = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.07);
  const modernPillBorder = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.38);

  return StyleSheet.create({
    header: modernTemplate
      ? {
          paddingTop: 9,
          paddingRight: 10.5,
          paddingBottom: 9.75,
          paddingLeft: 10.5,
          backgroundColor: modernHeaderFill,
          borderTopWidth: 3,
          borderTopColor: resume.design.accentColor,
        }
      : professionalTemplate
        ? {
            minHeight: showPhoto ? (28 * MILLIMETRES_TO_POINTS) + 18.75 : undefined,
            paddingTop: 9,
            paddingRight: showPhoto
              ? (28 * MILLIMETRES_TO_POINTS) + (24 * CSS_PIXELS_TO_POINTS)
              : 10.5,
            paddingBottom: 9.75,
            paddingLeft: 10.5,
            backgroundColor: professionalHeaderFill,
            borderTopWidth: 2.25,
            borderTopColor: resume.design.accentColor,
          }
        : {
            paddingBottom: 9,
            borderBottomWidth: 1.5,
            borderBottomColor: resume.design.accentColor,
          },
    name: modernTemplate
      ? {
          color: resume.design.accentColor,
          fontFamily: bodyFont,
          fontSize: 25,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: -0.75,
        }
      : {
          color: resume.design.textColor,
          fontFamily: headingFont,
          fontSize: 25,
          fontWeight: professionalTemplate ? 700 : 500,
          lineHeight: 1.05,
          letterSpacing: -0.5,
        },
    role: modernTemplate
      ? {
          marginTop: 3.75,
          marginBottom: 6,
          color: resume.design.textColor,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.9,
          textTransform: "uppercase",
        }
      : professionalTemplate
        ? {
            marginTop: 3,
            marginBottom: 6,
            color: resume.design.accentColor,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.68,
            textTransform: "uppercase",
          }
        : {
            marginTop: 3.75,
            marginBottom: 6,
            color: resume.design.accentColor,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.44,
          },
    sectionTitle: modernTemplate
      ? {
          marginBottom: 5.25,
          paddingTop: 1.5,
          paddingBottom: 1.5,
          paddingLeft: 6,
          color: resume.design.accentColor,
          borderLeftWidth: 2.25,
          borderLeftColor: resume.design.accentColor,
          fontFamily: bodyFont,
          fontSize: 9.5,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: 0.95,
          textTransform: "uppercase",
        }
      : {
          marginBottom: 5.25,
          paddingBottom: 2.25,
          color: resume.design.accentColor,
          borderBottomWidth: 0.75,
          borderBottomColor: subtleRule,
          fontFamily: headingFont,
          fontSize: resume.design.headingSize,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: professionalTemplate
            ? resume.design.headingSize * 0.08
            : resume.design.headingSize * 0.12,
          textTransform: "uppercase",
        },
    simpleItem: modernTemplate
      ? {
          color: resume.design.textColor,
          backgroundColor: resume.design.paperColor,
          borderWidth: 0.75,
          borderColor: modernPillBorder,
          borderRadius: 7.5,
        }
      : {
          color: resume.design.textColor,
          backgroundColor: subtleFill,
          borderRadius: 2.25,
        },
    photoFrame: {
      position: "absolute",
      top: professionalTemplate ? 9 : 0,
      right: professionalTemplate ? 10.5 : 0,
      width: 28 * MILLIMETRES_TO_POINTS,
      height: 28 * MILLIMETRES_TO_POINTS,
      overflow: "hidden",
      borderWidth: 1.5,
      borderColor: resume.design.accentColor,
      borderRadius:
        resume.design.photoShape === "circle"
          ? 14 * MILLIMETRES_TO_POINTS
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
