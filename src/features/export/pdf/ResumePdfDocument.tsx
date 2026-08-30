import {
  Document,
  Font,
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
  type TemplateLayout,
  type TemplateSkillStyle,
} from "../../../constants/resumeTemplates";
import type {
  ResumeDocument,
  ResumeSectionItem,
  ResumeSectionType,
} from "../../../domain/resume.types";
import { getFontAwesomeIconDefinition } from "../../icons/fontAwesomeRegistry";
import { createPdfContactIconData } from "./pdfContactIcon";
import {
  createPdfTemplateStyles,
  MILLIMETRES_TO_POINTS,
  pdfFontFamily,
} from "./pdfTemplateStyles";

// Resume text must copy cleanly into ATS/plain-text tools. The renderer's
// dictionary hyphenation can split headings and keywords into different text
// tokens (for example, "Certifica- tions"), so preserve complete words.
Font.registerHyphenationCallback((word) => [word]);

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
  simpleListColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 3,
  },
  simpleListRow: {
    width: "50%",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 0.75,
    paddingRight: 6,
    paddingBottom: 0.75,
  },
  simpleListMarker: { width: 9 },
  simpleListText: {
    flexGrow: 1,
    flexBasis: 0,
    fontSize: 9,
  },
  inlineSimpleText: { fontSize: 9 },
  functionalSkillItem: {
    width: "48%",
    borderRadius: 0,
  },
  techSkillList: { gap: 0 },
  techSkillRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 3,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
  },
  techSkillText: {
    flexGrow: 1,
    flexBasis: 0,
    paddingRight: 6,
    fontSize: 8.5,
  },
  techSkillTrack: {
    width: 26,
    height: 3,
  },
  numberedHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5.25,
  },
  numberedBadge: {
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7.5,
  },
  numberedBadgeText: {
    color: "#FFFFFF",
    fontSize: 6,
    fontWeight: 700,
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7.5,
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
  splitHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 9,
    borderBottomWidth: 1.5,
  },
  splitCopy: {
    flexGrow: 1,
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 18,
  },
  splitIdentity: {
    width: "55%",
    justifyContent: "center",
  },
  splitDetails: {
    width: "45%",
    alignItems: "flex-end",
  },
  splitContacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 4.5,
  },
  splitPhotoFrame: {
    width: 79.4,
    height: 79.4,
    marginLeft: 12,
    overflow: "hidden",
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1.5,
  },
  sidebarIdentity: {
    width: "42%",
    justifyContent: "center",
    paddingTop: 10,
    paddingRight: 11,
    paddingBottom: 10,
    paddingLeft: 11,
  },
  sidebarContacts: {
    flexGrow: 1,
    flexBasis: 0,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 3.5,
    paddingTop: 8,
    paddingRight: 10,
    paddingBottom: 8,
    paddingLeft: 10,
  },
  compactHeaderPhoto: {
    width: 72,
    height: 72,
    marginTop: 7,
    marginRight: 7,
    marginBottom: 7,
    overflow: "hidden",
    borderWidth: 2,
    borderRadius: 36,
  },
  statementHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingRight: 13,
    paddingBottom: 12,
    paddingLeft: 13,
  },
  statementIdentity: {
    width: "62%",
  },
  statementDetails: {
    width: "38%",
    alignItems: "flex-end",
    gap: 3.5,
  },
  showcaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 9,
    paddingRight: 10,
    paddingBottom: 9,
    paddingLeft: 10,
    borderBottomWidth: 3.75,
  },
  showcaseIdentity: {
    flexGrow: 1,
    flexBasis: 0,
  },
  showcaseContacts: {
    width: "34%",
    alignItems: "flex-end",
    gap: 3.5,
  },
  showcasePhoto: {
    width: 74,
    height: 84,
    overflow: "hidden",
    borderRadius: 5,
  },
  monogramHeader: {
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 2.25,
  },
  monogramPhoto: {
    width: 82,
    height: 82,
    marginBottom: 7,
    overflow: "hidden",
    borderWidth: 2,
    borderRadius: 41,
  },
  monogramContacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 8,
    rowGap: 2.5,
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
  layout,
  sectionType,
  paperColor,
  textColor,
}: {
  item: ResumeSectionItem;
  accentColor: string;
  bulletSize: number;
  entrySpacing: number;
  layout: TemplateLayout;
  sectionType: ResumeSectionType;
  paperColor: string;
  textColor: string;
}) {
  const timelineEntry = layout === "rail" || layout === "professional";
  const statementEntry = layout === "statement";
  const ruledEntry = layout === "tech" || layout === "healthcare";
  const portfolioProject = (layout === "portfolio" || layout === "showcase")
    && sectionType === "projects";
  const centeredEntry = layout === "student"
    && (sectionType === "education" || sectionType === "projects");
  const subtleRule = mixHexColors(accentColor, paperColor, 0.32);
  const subtleFill = mixHexColors(accentColor, paperColor, 0.055);

  return (
    <View
      style={[
        styles.entry,
        { paddingBottom: entrySpacing },
        timelineEntry ? {
          position: "relative",
          marginLeft: 3,
          paddingLeft: 9.75,
          borderLeftWidth: 0.75,
          borderLeftColor: subtleRule,
        } : {},
        ruledEntry ? {
          paddingLeft: 7.5,
          borderLeftWidth: 1.5,
          borderLeftColor: subtleRule,
        } : {},
        statementEntry ? {
          position: "relative",
          paddingLeft: 82,
        } : {},
        portfolioProject ? {
          width: "48%",
          paddingTop: 6.75,
          paddingRight: 6.75,
          paddingBottom: 6.75,
          paddingLeft: 6.75,
          backgroundColor: subtleFill,
          borderWidth: 0.75,
          borderColor: subtleRule,
        } : {},
        centeredEntry ? { alignItems: "center", textAlign: "center" } : {},
      ]}
    >
      {timelineEntry && (
        <View
          style={{
            position: "absolute",
            top: 2,
            left: -3.5,
            width: 7,
            height: 7,
            backgroundColor: paperColor,
            borderWidth: 1.5,
            borderColor: accentColor,
            borderRadius: 3.5,
          }}
        />
      )}
      {statementEntry && (
        <View
          style={{
            position: "absolute",
            top: 3,
            left: 74,
            width: 6,
            height: 6,
            backgroundColor: accentColor,
            borderRadius: 3,
          }}
        />
      )}
      <View
        style={[
          styles.entryHeading,
          centeredEntry || portfolioProject
            ? { flexDirection: "column", alignItems: centeredEntry ? "center" : "flex-start", gap: 1.5 }
            : {},
        ]}
        minPresenceAhead={20}
      >
        <Text style={[styles.entryTitle, { color: textColor }]}>{item.title}</Text>
        {item.meta && (
          <Text
            style={[
              styles.entryMeta,
              statementEntry ? {
                position: "absolute",
                top: 0,
                left: -82,
                width: 70,
                color: accentColor,
                fontWeight: 700,
              } : {},
            ]}
          >
            {item.meta}
          </Text>
        )}
      </View>
      {item.subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: accentColor,
              textAlign: centeredEntry ? "center" : "left",
              textTransform: layout === "tech" ? "uppercase" : "none",
              letterSpacing: layout === "tech" ? 0.4 : 0,
            },
          ]}
        >
          {item.subtitle}
        </Text>
      )}
      {item.description && <Text style={styles.description}>{item.description}</Text>}
      {item.bullets.length > 0 && (
        <View style={styles.bulletList}>
          {item.bullets.map((bullet, index) => (
            <View style={styles.bulletRow} key={`${item.id}-${index}`} wrap>
              <Text style={[styles.bulletMarker, { color: accentColor, fontSize: bulletSize }]}>{"\u2022"}</Text>
              <Text style={styles.bulletText} orphans={2} widows={2}>{bullet}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PdfSimpleItems({
  items,
  skillStyle,
  layout,
  sectionType,
  accentColor,
  paperColor,
  bulletSize,
  itemStyle,
}: {
  items: ResumeSectionItem[];
  skillStyle: TemplateSkillStyle;
  layout: TemplateLayout;
  sectionType: ResumeSectionType;
  accentColor: string;
  paperColor: string;
  bulletSize: number;
  itemStyle: ReturnType<typeof createPdfTemplateStyles>["simpleItem"];
}) {
  const subtleRule = mixHexColors(accentColor, paperColor, 0.28);

  if (layout === "tech" && sectionType === "skills") {
    return (
      <View style={[styles.simpleList, styles.techSkillList]}>
        {items.map((item, index) => {
          const proficiency = [0.72, 0.86, 0.62][index % 3] ?? 0.72;
          return (
            <View style={[styles.techSkillRow, { borderBottomColor: subtleRule }]} key={item.id}>
              <Text style={styles.techSkillText}>{item.title}</Text>
              <View style={[styles.techSkillTrack, { backgroundColor: subtleRule }]}>
                <View
                  style={{
                    width: 26 * proficiency,
                    height: 3,
                    backgroundColor: accentColor,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  if (skillStyle === "list") {
    return (
      <View style={styles.simpleListColumns}>
        {items.map((item) => (
          <View style={styles.simpleListRow} key={item.id}>
            <Text style={[styles.simpleListMarker, { color: accentColor, fontSize: bulletSize }]}>{"\u2022"}</Text>
            <Text style={styles.simpleListText}>{item.title}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (skillStyle === "inline") {
    return (
      <Text style={styles.inlineSimpleText}>
        {items.map((item, index) => (
          <Text key={item.id}>
            {index > 0 ? "   " : ""}
            <Text style={{ color: accentColor, fontSize: bulletSize }}>{"\u2022"}</Text>
            {`  ${item.title}`}
          </Text>
        ))}
      </Text>
    );
  }

  return (
    <View style={styles.simpleList}>
      {items.map((item) => (
        <Text
          key={item.id}
          style={[
            styles.simpleItem,
            itemStyle,
            layout === "functional" && sectionType === "skills"
              ? styles.functionalSkillItem
              : {},
          ]}
        >
          {item.title}
        </Text>
      ))}
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
  const usesTwoColumns = [
    "professional",
    "functional",
    "tech",
    "sidebar",
    "showcase",
    "monogram",
  ].includes(selectedTemplate.layout);
  const indexedSections = sections.map((section, sectionIndex) => ({ section, sectionIndex }));
  const summarySections = usesTwoColumns
    ? indexedSections.filter(({ section }) => section.type === "summary")
    : [];
  const isSidebarSection = (section: ResumeDocument["sections"][number]) => (
    sidebarSectionTypes.has(section.type)
    || (selectedTemplate.layout === "monogram" && section.type === "education")
  );
  const mainSections = indexedSections.filter(({ section }) => (
    section.type !== "summary" && !isSidebarSection(section)
  ));
  const sidebarSections = indexedSections.filter(({ section }) => (
    section.type !== "summary" && isSidebarSection(section)
  ));
  const sidebarFill = mixHexColors(resume.design.accentColor, resume.design.paperColor, 0.08);

  const renderContacts = (color: string, iconColor: string) => contacts.flatMap(
    (contact, index) => [
      ...(!resume.design.showContactIcons && index > 0
        ? [<Text key={`separator-${contact.value}-${index}`} style={{ color: iconColor }}>{"\u2022"}</Text>]
        : []),
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
      />,
    ],
  );

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
        {selectedTemplate.sectionStyle === "numbered" ? (
          <View style={styles.numberedHeading} minPresenceAhead={28}>
            <View style={[styles.numberedBadge, { backgroundColor: resume.design.accentColor }]}>
              <Text style={styles.numberedBadgeText}>
                {String(sectionIndex + 1).padStart(2, "0")}
              </Text>
            </View>
            <Text style={[templateStyles.sectionTitle, { flexGrow: 1, marginBottom: 0 }]}>
              {section.title}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              templateStyles.sectionTitle,
              centeredSection ? templateStyles.centeredSectionTitle : {},
            ]}
            minPresenceAhead={28}
          >
            {section.title}
          </Text>
        )}
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
            <PdfSimpleItems
              items={section.items}
              skillStyle={selectedTemplate.skillStyle}
              layout={selectedTemplate.layout}
              sectionType={section.type}
              accentColor={resume.design.accentColor}
              paperColor={resume.design.paperColor}
              bulletSize={resume.design.bulletSize}
              itemStyle={templateStyles.simpleItem}
            />
          ) : (
            <View
              style={
                ["portfolio", "showcase"].includes(selectedTemplate.layout) && section.type === "projects"
                  ? styles.portfolioGrid
                  : {}
              }
            >
              {section.items.map((item) => (
                <PdfEntry
                  key={item.id}
                  item={item}
                  accentColor={resume.design.accentColor}
                  bulletSize={resume.design.bulletSize}
                  entrySpacing={resume.design.entrySpacing * densityFactor}
                  layout={selectedTemplate.layout}
                  sectionType={section.type}
                  paperColor={resume.design.paperColor}
                  textColor={resume.design.textColor}
                />
              ))}
            </View>
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
        ) : selectedTemplate.layout === "sidebar" ? (
          <View style={[styles.sidebarHeader, { borderBottomColor: resume.design.accentColor }]}>
            <View style={[styles.sidebarIdentity, { backgroundColor: resume.design.accentColor }]}>
              <Text style={[templateStyles.name, { color: "#FFFFFF" }]}>{resume.personal.fullName}</Text>
              <Text style={[templateStyles.role, { color: "#FFFFFF" }]}>{resume.personal.professionalTitle}</Text>
            </View>
            <View style={styles.sidebarContacts}>
              {renderContacts(resume.design.textColor, resume.design.accentColor)}
            </View>
            {showPhoto && (
              <View style={[styles.compactHeaderPhoto, { borderColor: resume.design.accentColor }]}>
                <Image src={resume.personal.photo} style={templateStyles.photo} />
              </View>
            )}
          </View>
        ) : selectedTemplate.layout === "statement" ? (
          <View
            style={[
              styles.statementHeader,
              { backgroundColor: mixHexColors(resume.design.accentColor, "#111827", 0.76) },
            ]}
          >
            <View style={styles.statementIdentity}>
              <Text style={[templateStyles.name, { color: "#FFFFFF" }]}>{resume.personal.fullName}</Text>
            </View>
            <View style={styles.statementDetails}>
              <Text style={[templateStyles.role, { color: "#FFFFFF", textAlign: "right" }]}>
                {resume.personal.professionalTitle}
              </Text>
              {renderContacts("#FFFFFF", "#FFFFFF")}
            </View>
          </View>
        ) : selectedTemplate.layout === "showcase" ? (
          <View
            style={[
              styles.showcaseHeader,
              {
                backgroundColor: sidebarFill,
                borderBottomColor: resume.design.accentColor,
              },
            ]}
          >
            {showPhoto && (
              <View style={styles.showcasePhoto}>
                <Image src={resume.personal.photo} style={templateStyles.photo} />
              </View>
            )}
            <View style={styles.showcaseIdentity}>
              <Text style={[templateStyles.name, { color: resume.design.textColor }]}>{resume.personal.fullName}</Text>
              <Text style={[templateStyles.role, { color: resume.design.accentColor }]}>{resume.personal.professionalTitle}</Text>
            </View>
            <View style={styles.showcaseContacts}>
              {renderContacts(resume.design.textColor, resume.design.accentColor)}
            </View>
          </View>
        ) : selectedTemplate.layout === "monogram" ? (
          <View style={[styles.monogramHeader, { borderBottomColor: resume.design.accentColor }]}>
            {showPhoto && (
              <View style={[styles.monogramPhoto, { borderColor: resume.design.accentColor }]}>
                <Image src={resume.personal.photo} style={templateStyles.photo} />
              </View>
            )}
            <Text style={[templateStyles.name, { color: resume.design.accentColor }]}>{resume.personal.fullName}</Text>
            <Text style={templateStyles.role}>{resume.personal.professionalTitle}</Text>
            <View style={styles.monogramContacts}>
              {renderContacts(resume.design.textColor, resume.design.accentColor)}
            </View>
          </View>
        ) : selectedTemplate.layout === "split" ? (
          <View style={[styles.splitHeader, { borderBottomColor: resume.design.accentColor }]}>
            <View style={styles.splitCopy}>
              <View style={styles.splitIdentity}>
                <Text style={templateStyles.name}>{resume.personal.fullName}</Text>
              </View>
              <View style={styles.splitDetails}>
                <Text style={[templateStyles.role, { textAlign: "right" }]}>
                  {resume.personal.professionalTitle}
                </Text>
                <View style={styles.splitContacts}>
                  {renderContacts(resume.design.textColor, resume.design.accentColor)}
                </View>
              </View>
            </View>
            {showPhoto && (
              <View
                style={[
                  styles.splitPhotoFrame,
                  {
                    borderWidth: 1.5,
                    borderColor: resume.design.accentColor,
                    borderRadius: resume.design.photoShape === "circle"
                      ? 39.7
                      : resume.design.photoShape === "rounded" ? 14 : 0,
                  },
                ]}
              >
                <Image src={resume.personal.photo} style={templateStyles.photo} />
              </View>
            )}
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
        {selectedTemplate.layout === "healthcare" && (
          <View
            style={{
              height: 0.75,
              marginTop: 1.5,
              backgroundColor: resume.design.accentColor,
            }}
          />
        )}

        {usesTwoColumns ? (
          <>
            {summarySections.map(({ section, sectionIndex }) => renderSection(section, sectionIndex))}
            <View style={styles.twoColumnBody} wrap>
              {(selectedTemplate.layout === "functional" || selectedTemplate.layout === "sidebar") && (
                <View
                  style={[
                    styles.sideColumn,
                    { backgroundColor: sidebarFill },
                    selectedTemplate.layout === "sidebar" ? { width: "32%" } : {},
                  ]}
                >
                  {sidebarSections.map(({ section, sectionIndex }) => renderSection(section, sectionIndex))}
                </View>
              )}
              <View
                style={[
                  styles.mainColumn,
                  selectedTemplate.layout === "monogram" ? { width: "55%" } : {},
                  selectedTemplate.layout === "sidebar" ? { width: "68%" } : {},
                  selectedTemplate.layout === "showcase" ? { width: "63%" } : {},
                ]}
              >
                {mainSections.map(({ section, sectionIndex }) => renderSection(section, sectionIndex))}
              </View>
              {selectedTemplate.layout !== "functional" && selectedTemplate.layout !== "sidebar" && (
                <View
                  style={[
                    styles.sideColumn,
                    { backgroundColor: sidebarFill },
                    selectedTemplate.layout === "monogram" ? { width: "45%" } : {},
                    selectedTemplate.layout === "showcase" ? { width: "37%" } : {},
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
