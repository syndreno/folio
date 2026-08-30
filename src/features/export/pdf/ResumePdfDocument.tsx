import {
  Document,
  Image,
  Link,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  getResumeTemplate,
  getTemplateDensityFactor,
} from "../../../constants/resumeTemplates";
import type { ResumeDocument, ResumeSectionItem } from "../../../domain/resume.types";
import { getFontAwesomeIconDefinition } from "../../icons/fontAwesomeRegistry";
import { createPdfContactIconData } from "./pdfContactIcon";
import {
  createPdfTemplateStyles,
  MILLIMETRES_TO_POINTS,
  pdfFontFamily,
} from "./pdfTemplateStyles";

const styles = StyleSheet.create({
  page: {},
  contacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 9,
    rowGap: 2.25,
  },
  contactText: {
    fontSize: 8.5,
    textDecoration: "none",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    textDecoration: "none",
  },
  contactIcon: {
    width: 8,
    height: 8,
  },
  section: {},
  summary: { margin: 0 },
  entry: {},
  entryHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 9,
  },
  entryTitle: {
    flexGrow: 1,
    fontSize: 10.5,
    fontWeight: 700,
  },
  entryMeta: {
    flexShrink: 0,
    fontSize: 8.5,
  },
  subtitle: {
    marginTop: 0.75,
    marginBottom: 3,
    fontWeight: 700,
  },
  description: {
    marginTop: 2.25,
    marginBottom: 0,
  },
  bulletList: { marginTop: 3 },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 1.5,
    paddingLeft: 0,
  },
  bulletMarker: {
    width: 12.75,
    paddingLeft: 1.5,
  },
  bulletText: { flex: 1 },
  simpleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4.5,
  },
  simpleItem: {
    paddingTop: 2.25,
    paddingRight: 6,
    paddingBottom: 2.25,
    paddingLeft: 6,
    fontSize: 9,
  },
  twoColumnBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  mainColumn: {
    width: "64%",
  },
  sideColumn: {
    width: "36%",
    paddingRight: 7.5,
    paddingBottom: 7.5,
    paddingLeft: 7.5,
  },
  professionalHeader: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 9.75,
    borderBottomWidth: 1.5,
  },
  professionalIdentity: {
    flexGrow: 1,
    flexBasis: 0,
  },
  professionalContacts: {
    width: "37%",
    alignItems: "flex-end",
    gap: 3.75,
  },
  professionalPhotoFrame: {
    width: 84,
    height: 84,
    marginRight: 14,
    marginLeft: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderRadius: 42,
  },
  professionalPhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  techHeader: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 3,
  },
  techIdentity: {
    width: "60%",
    justifyContent: "center",
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
  },
  techContacts: {
    width: "40%",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 3.75,
    paddingTop: 9,
    paddingRight: 10,
    paddingBottom: 9,
    paddingLeft: 10,
  },
});

function mixHexColors(foreground: string, background: string, foregroundRatio: number): string {
  const foregroundValue = Number.parseInt(foreground.replace("#", ""), 16);
  const backgroundValue = Number.parseInt(background.replace("#", ""), 16);
  const channel = (shift: number) => Math.round(
    ((foregroundValue >> shift) & 0xff) * foregroundRatio
      + ((backgroundValue >> shift) & 0xff) * (1 - foregroundRatio),
  );
  return `#${[channel(16), channel(8), channel(0)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function safeWebUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function PdfContact({
  value,
  href,
  color,
  accentColor,
  icon,
}: {
  value: string;
  href?: string;
  color: string;
  accentColor: string;
  icon?: IconDefinition;
}) {
  const iconData = createPdfContactIconData(icon);
  const content = (
    <>
      {iconData && (
        <Svg viewBox={iconData.viewBox} style={styles.contactIcon}>
          {iconData.paths.map((path, index) => (
            <Path d={path} fill={accentColor} key={`${path.slice(0, 24)}-${index}`} />
          ))}
        </Svg>
      )}
      <Text style={[styles.contactText, { color }]}>{value}</Text>
    </>
  );

  if (href) return <Link src={href} style={styles.contactItem}>{content}</Link>;
  return <View style={styles.contactItem}>{content}</View>;
}

function PdfEntry({
  item,
  accentColor,
  bulletSize,
  entrySpacing,
  isFirst,
}: {
  item: ResumeSectionItem;
  accentColor: string;
  bulletSize: number;
  entrySpacing: number;
  isFirst: boolean;
}) {
  return (
    <View style={[styles.entry, { marginTop: isFirst ? 0 : entrySpacing }]}>
      <View style={styles.entryHeading} minPresenceAhead={20}>
        <Text style={styles.entryTitle}>{item.title}</Text>
        {item.meta && <Text style={styles.entryMeta}>{item.meta}</Text>}
      </View>
      {item.subtitle && <Text style={[styles.subtitle, { color: accentColor }]}>{item.subtitle}</Text>}
      {item.description && <Text style={styles.description}>{item.description}</Text>}
      {item.bullets.length > 0 && (
        <View style={styles.bulletList}>
          {item.bullets.map((bullet, index) => (
            <View style={styles.bulletRow} key={`${item.id}-${index}`} wrap>
              <Text style={[styles.bulletMarker, { color: accentColor, fontSize: bulletSize }]}>•</Text>
              <Text style={styles.bulletText} orphans={2} widows={2}>{bullet}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ResumePdfDocument({ resume }: { resume: ResumeDocument }) {
  const selectedTemplate = getResumeTemplate(resume.design.templateId);
  const densityFactor = getTemplateDensityFactor(selectedTemplate.density);
  const bodyFont = pdfFontFamily(resume.design.fontFamily);
  const templateStyles = createPdfTemplateStyles(resume);
  const showPhoto = selectedTemplate.supportsPhoto
    && resume.design.showPhoto
    && /^data:image\/(?:png|jpeg);base64,/i.test(resume.personal.photo);
  const headerContactColor = selectedTemplate.layout === "tech"
    ? "#FFFFFF"
    : resume.design.textColor;
  const pageMarginPoints = resume.design.pageMargin * MILLIMETRES_TO_POINTS;
  const sections = [...resume.sections]
    .filter((section) => section.visible)
    .sort((first, second) => first.order - second.order);
  const contacts = [
    { value: resume.personal.email, href: resume.personal.email ? `mailto:${resume.personal.email}` : undefined, iconUrl: resume.design.contactIconUrls.email },
    { value: resume.personal.phone, href: undefined, iconUrl: resume.design.contactIconUrls.phone },
    { value: resume.personal.location, href: undefined, iconUrl: resume.design.contactIconUrls.location },
    { value: resume.personal.website, href: safeWebUrl(resume.personal.website), iconUrl: resume.design.contactIconUrls.website },
    { value: resume.personal.linkedin, href: safeWebUrl(resume.personal.linkedin), iconUrl: resume.design.contactIconUrls.linkedin },
    { value: resume.personal.github, href: safeWebUrl(resume.personal.github), iconUrl: resume.design.contactIconUrls.github },
    ...resume.personal.customLinks.map((link) => ({
      value: link.title,
      href: safeWebUrl(link.url),
      iconUrl: link.iconUrl,
    })),
  ].filter((contact) => contact.value);
  const sidebarSectionTypes = new Set(["skills", "certifications", "languages", "interests", "awards"]);
  const usesTwoColumns = ["professional", "functional", "tech"].includes(selectedTemplate.layout);
  const indexedSections = sections.map((section, sectionIndex) => ({ section, sectionIndex }));
  const summarySections = usesTwoColumns
    ? indexedSections.filter(({ section }) => section.type === "summary")
    : [];
  const mainSections = indexedSections.filter(({ section }) => (
    section.type !== "summary" && !sidebarSectionTypes.has(section.type)
  ));
  const sidebarSections = indexedSections.filter(({ section }) => (
    section.type !== "summary" && sidebarSectionTypes.has(section.type)
  ));
  const sidebarFill = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.08);

  const renderContacts = (color: string, iconColor: string) => contacts.map((contact, index) => (
    <PdfContact
      key={`${contact.value}-${index}`}
      value={contact.value}
      href={contact.href}
      color={color}
      accentColor={iconColor}
      icon={
        resume.design.showContactIcons
          ? getFontAwesomeIconDefinition(contact.iconUrl)
          : undefined
      }
    />
  ));

  const renderSection = (
    section: ResumeDocument["sections"][number],
    sectionIndex: number,
  ) => {
    const simpleItems = section.items.every(
      (item) => !item.subtitle && !item.meta && !item.description && item.bullets.length === 0,
    );
    const highlightedSection = (
      selectedTemplate.layout === "functional"
      && (section.type === "summary" || section.type === "skills")
    ) || (
      selectedTemplate.layout === "healthcare"
      && (section.type === "certifications" || section.type === "skills")
    );
    const centeredSection = selectedTemplate.layout === "student"
      && (section.type === "education" || section.type === "projects");
    return (
      <View
        style={[
          styles.section,
          templateStyles.section,
          { marginTop: resume.design.sectionSpacing * densityFactor },
        ]}
        key={section.id}
      >
        <Text
          style={[
            templateStyles.sectionTitle,
            centeredSection ? templateStyles.centeredSectionTitle : {},
          ]}
          minPresenceAhead={28}
        >
          {selectedTemplate.sectionStyle === "numbered"
            ? `${String(sectionIndex + 1).padStart(2, "0")}  ${section.title}`
            : section.title}
        </Text>
        <View
          style={[
            templateStyles.sectionContent,
            highlightedSection ? templateStyles.highlightedSectionContent : {},
          ]}
        >
          {section.content && (
            <Text style={[styles.summary, templateStyles.summary]} orphans={2} widows={2}>
              {section.content}
            </Text>
          )}
          {simpleItems ? (
            <View style={styles.simpleList}>
              {section.items.map((item) => (
                <Text key={item.id} style={[styles.simpleItem, templateStyles.simpleItem]}>
                  {selectedTemplate.skillStyle === "list" ? `• ${item.title}` : item.title}
                </Text>
              ))}
            </View>
          ) : (
            section.items.map((item, index) => (
              <PdfEntry
                key={item.id}
                item={item}
                accentColor={resume.design.accentColor}
                bulletSize={resume.design.bulletSize}
                entrySpacing={resume.design.entrySpacing * densityFactor}
                isFirst={index === 0}
              />
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <Document
      title={`${resume.personal.fullName} Resume`}
      author={resume.personal.fullName}
      subject="Professional resume"
      keywords="resume, experience, education, skills"
    >
      <Page
        size={resume.design.pageSize}
        wrap
        style={[
          styles.page,
          {
            paddingTop: pageMarginPoints,
            paddingRight: pageMarginPoints,
            paddingBottom: pageMarginPoints,
            paddingLeft: pageMarginPoints,
            backgroundColor: resume.design.paperColor,
            color: resume.design.textColor,
            fontFamily: bodyFont,
            fontSize: resume.design.fontSize,
            lineHeight: resume.design.lineHeight,
            letterSpacing: resume.design.letterSpacing,
          },
        ]}
      >
        {selectedTemplate.layout === "professional" ? (
          <View style={[styles.professionalHeader, { borderBottomColor: resume.design.accentColor }]}>
            <View style={styles.professionalIdentity}>
              <Text style={templateStyles.name}>{resume.personal.fullName}</Text>
              <Text style={templateStyles.role}>{resume.personal.professionalTitle}</Text>
            </View>
            {showPhoto && (
              <View style={[styles.professionalPhotoFrame, { borderColor: resume.design.accentColor }]}>
                <Image src={resume.personal.photo} style={styles.professionalPhoto} />
              </View>
            )}
            <View style={styles.professionalContacts}>
              {renderContacts(resume.design.textColor, resume.design.accentColor)}
            </View>
          </View>
        ) : selectedTemplate.layout === "tech" ? (
          <View style={[styles.techHeader, { borderBottomColor: resume.design.accentColor }]}>
            <View style={[styles.techIdentity, { backgroundColor: sidebarFill }]}>
              <Text style={[templateStyles.name, { color: resume.design.textColor }]}>{resume.personal.fullName}</Text>
              <Text style={[templateStyles.role, { color: resume.design.accentColor }]}>{resume.personal.professionalTitle}</Text>
            </View>
            <View
              style={[
                styles.techContacts,
                { backgroundColor: mixHexColors(resume.design.accentColor, "#14201C", 0.74) },
              ]}
            >
              {renderContacts("#FFFFFF", "#FFFFFF")}
            </View>
          </View>
        ) : (
          <View style={templateStyles.header}>
            <Text style={templateStyles.name}>{resume.personal.fullName}</Text>
            <Text style={templateStyles.role}>{resume.personal.professionalTitle}</Text>
            <View style={[styles.contacts, templateStyles.contacts]}>
              {renderContacts(headerContactColor, resume.design.accentColor)}
            </View>
            {showPhoto && (
              <View style={templateStyles.photoFrame}>
                <Image src={resume.personal.photo} style={templateStyles.photo} />
              </View>
            )}
          </View>
        )}

        {usesTwoColumns ? (
          <>
            {summarySections.map(({ section, sectionIndex }) => renderSection(section, sectionIndex))}
            <View style={styles.twoColumnBody} wrap>
              {selectedTemplate.layout === "functional" && (
                <View style={[styles.sideColumn, { backgroundColor: sidebarFill }]}>
                  {sidebarSections.map(({ section, sectionIndex }) => renderSection(section, sectionIndex))}
                </View>
              )}
              <View style={styles.mainColumn}>
                {mainSections.map(({ section, sectionIndex }) => renderSection(section, sectionIndex))}
              </View>
              {selectedTemplate.layout !== "functional" && (
                <View
                  style={[
                    styles.sideColumn,
                    { backgroundColor: sidebarFill },
                  ]}
                >
                  {sidebarSections.map(({ section, sectionIndex }) => renderSection(section, sectionIndex))}
                </View>
              )}
            </View>
          </>
        ) : sections.map((section, sectionIndex) => renderSection(section, sectionIndex))}
      </Page>
    </Document>
  );
}
