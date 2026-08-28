import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ResumeDocument, ResumeSectionItem } from "../../../domain/resume.types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 46,
    paddingRight: 50,
    paddingBottom: 46,
    paddingLeft: 50,
  },
  header: {
    paddingBottom: 9,
    borderBottomWidth: 1.5,
  },
  name: {
    fontSize: 23,
    lineHeight: 1.08,
  },
  role: {
    marginTop: 3,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  contacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contactText: {
    fontSize: 8.3,
    color: "#26332F",
    textDecoration: "none",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    paddingBottom: 2.5,
    borderBottomWidth: 0.7,
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  summary: {
    marginTop: 5,
  },
  entry: {
    marginTop: 6,
  },
  entryHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  entryTitle: {
    flexGrow: 1,
    fontWeight: 700,
  },
  entryMeta: {
    flexShrink: 0,
    fontSize: 8.2,
  },
  subtitle: {
    marginTop: 1,
    fontWeight: 700,
  },
  description: {
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 2,
    paddingLeft: 3,
  },
  bulletMarker: {
    width: 12,
  },
  bulletText: {
    flex: 1,
  },
  simpleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 5,
  },
  simpleItem: {
    paddingTop: 2,
    paddingRight: 5,
    paddingBottom: 2,
    paddingLeft: 5,
    borderWidth: 0.5,
    borderRadius: 2,
  },
  pageNumber: {
    position: "absolute",
    right: 50,
    bottom: 20,
    color: "#66716D",
    fontSize: 7,
  },
});

function pdfFontFamily(fontFamily: string): string {
  return fontFamily === "Georgia" || fontFamily === "Times New Roman" ? "Times-Roman" : "Helvetica";
}

function safeWebUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function PdfContact({ value, href }: { value: string; href?: string }) {
  if (href) {
    return <Link src={href} style={styles.contactText}>{value}</Link>;
  }
  return <Text style={styles.contactText}>{value}</Text>;
}

function PdfEntry({
  item,
  accentColor,
  bulletSize,
}: {
  item: ResumeSectionItem;
  accentColor: string;
  bulletSize: number;
}) {
  return (
    <View style={styles.entry}>
      <View style={styles.entryHeading} minPresenceAhead={20}>
        <Text style={styles.entryTitle}>{item.title}</Text>
        {item.meta && <Text style={styles.entryMeta}>{item.meta}</Text>}
      </View>
      {item.subtitle && <Text style={[styles.subtitle, { color: accentColor }]}>{item.subtitle}</Text>}
      {item.description && <Text style={styles.description}>{item.description}</Text>}
      {item.bullets.map((bullet, index) => (
        <View style={styles.bulletRow} key={`${item.id}-${index}`} wrap>
          <Text style={[styles.bulletMarker, { color: accentColor, fontSize: bulletSize }]}>•</Text>
          <Text style={styles.bulletText} orphans={2} widows={2}>{bullet}</Text>
        </View>
      ))}
    </View>
  );
}

export function ResumePdfDocument({ resume }: { resume: ResumeDocument }) {
  const bodyFont = pdfFontFamily(resume.design.fontFamily);
  const headingFont = pdfFontFamily(resume.design.headingFontFamily);
  const sections = [...resume.sections]
    .filter((section) => section.visible)
    .sort((first, second) => first.order - second.order);
  const contacts = [
    { value: resume.personal.email, href: resume.personal.email ? `mailto:${resume.personal.email}` : undefined },
    { value: resume.personal.phone, href: undefined },
    { value: resume.personal.location, href: undefined },
    { value: resume.personal.website, href: safeWebUrl(resume.personal.website) },
    { value: resume.personal.linkedin, href: safeWebUrl(resume.personal.linkedin) },
    { value: resume.personal.github, href: safeWebUrl(resume.personal.github) },
    ...resume.personal.customLinks.map((link) => ({
      value: link.title,
      href: safeWebUrl(link.url),
    })),
  ].filter((contact) => contact.value);

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
            backgroundColor: resume.design.paperColor,
            color: resume.design.textColor,
            fontFamily: bodyFont,
            fontSize: resume.design.fontSize,
            lineHeight: resume.design.lineHeight,
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: resume.design.accentColor }]}>
          <Text style={[styles.name, { fontFamily: headingFont }]}>{resume.personal.fullName}</Text>
          <Text style={[styles.role, { color: resume.design.accentColor }]}>
            {resume.personal.professionalTitle}
          </Text>
          <View style={styles.contacts}>
            {contacts.map((contact, index) => (
              <PdfContact key={`${contact.value}-${index}`} value={contact.value} href={contact.href} />
            ))}
          </View>
        </View>

        {sections.map((section) => {
          const simpleItems = section.items.every(
            (item) => !item.subtitle && !item.meta && !item.description && item.bullets.length === 0,
          );
          return (
            <View style={styles.section} key={section.id}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    borderBottomColor: resume.design.accentColor,
                    color: resume.design.accentColor,
                    fontFamily: headingFont,
                  },
                ]}
                minPresenceAhead={28}
              >
                {section.title}
              </Text>
              {section.content && (
                <Text style={styles.summary} orphans={2} widows={2}>{section.content}</Text>
              )}
              {simpleItems ? (
                <View style={styles.simpleList}>
                  {section.items.map((item) => (
                    <Text
                      key={item.id}
                      style={[styles.simpleItem, { borderColor: resume.design.accentColor }]}
                    >
                      {item.title}
                    </Text>
                  ))}
                </View>
              ) : (
                section.items.map((item) => (
                  <PdfEntry
                    key={item.id}
                    item={item}
                    accentColor={resume.design.accentColor}
                    bulletSize={resume.design.bulletSize}
                  />
                ))
              )}
            </View>
          );
        })}

        <Text
          fixed
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
