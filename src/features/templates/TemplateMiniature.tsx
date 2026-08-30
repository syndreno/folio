import type { CSSProperties } from "react";
import type { ResumeTemplateDefinition } from "./registry";

const PREVIEW_PROFILES: Record<ResumeTemplateDefinition["audience"], {
  initials: string;
  name: string;
  role: string;
  location: string;
}> = {
  general: { initials: "MC", name: "Maya Chen", role: "Product Manager", location: "Toronto, Canada" },
  student: { initials: "AM", name: "Alex Morgan", role: "Business Graduate", location: "Boston, MA" },
  technology: { initials: "MC", name: "Maya Chen", role: "Software Engineer", location: "Toronto, Canada" },
  executive: { initials: "MR", name: "Morgan Reed", role: "VP of Operations", location: "Chicago, IL" },
  creative: { initials: "SL", name: "Sofia Laurent", role: "Brand Designer", location: "Paris, France" },
  academic: { initials: "EB", name: "Elias Bennett", role: "Research Fellow", location: "Oxford, UK" },
  service: { initials: "NP", name: "Nina Patel", role: "Guest Experience Lead", location: "London, UK" },
};

export function TemplateMiniature({
  template,
  large = false,
}: {
  template: ResumeTemplateDefinition;
  large?: boolean;
}) {
  const profile = PREVIEW_PROFILES[template.audience];
  const hasSidebar = [
    "split",
    "professional",
    "tech",
    "functional",
    "sidebar",
    "showcase",
    "monogram",
  ].includes(
    template.layoutFamily,
  );
  const previewEmail = `${profile.name.split(" ")[0]?.toLocaleLowerCase("en") ?? "hello"}@example.com`;
  const previewStyle = {
    "--ui-accent": template.visualPreset.accentColor,
    "--mini-paper": template.visualPreset.paperColor,
    "--mini-ink": template.visualPreset.textColor,
    "--mini-body-font": template.visualPreset.fontFamily,
    "--mini-heading-font": template.visualPreset.headingFontFamily,
  } as CSSProperties;

  return (
    <span
      className={`template-miniature${large ? " large" : ""}${template.supportsPhoto ? " with-photo" : ""}`}
      data-layout={template.layout}
      data-section-style={template.sectionStyle}
      data-skill-style={template.skillStyle}
      data-density={template.density}
      data-format={template.format}
      data-audience={template.audience}
      style={previewStyle}
      aria-hidden="true"
    >
      <span className="template-miniature-page">
        <span className="mini-header">
          <strong>{profile.name}</strong>
          <span className="mini-role">{profile.role}</span>
          <span className="mini-contact">{profile.location} · {previewEmail} · +1 555 0182</span>
        </span>

        <span className="mini-layout-body">
          <span className="mini-main-column">
            <span className="mini-section mini-summary-section">
              <strong className="mini-section-title">Profile</strong>
              <span className="mini-copy">
                Collaborative professional who turns complex problems into clear, measurable results.
              </span>
            </span>

            <span className="mini-section mini-experience-section">
              <strong className="mini-section-title">Experience</strong>
              <span className="mini-entry">
                <span className="mini-entry-heading">
                  <b>Senior {profile.role}</b><em>2022—Present</em>
                </span>
                <i>Northstar Labs</i>
                <span className="mini-bullet">Led cross-functional launches across three markets.</span>
                <span className="mini-bullet">Improved delivery speed by 32%.</span>
              </span>
              <span className="mini-entry">
                <span className="mini-entry-heading">
                  <b>{profile.role}</b><em>2019—2022</em>
                </span>
                <i>Meridian Group</i>
                <span className="mini-bullet">Built scalable systems used by global teams.</span>
              </span>
            </span>

            <span className="mini-section mini-education-section">
              <strong className="mini-section-title">Education</strong>
              <span className="mini-entry-heading"><b>University of Toronto</b><em>2019</em></span>
              <span className="mini-copy">B.Sc. Business &amp; Technology</span>
            </span>

            {!hasSidebar && (
              <>
                <span className="mini-section mini-skills-section">
                  <strong className="mini-section-title">Skills</strong>
                  <span className="mini-skill-list">
                    <span>Strategy</span><span>Research</span><span>Leadership</span><span>Analytics</span>
                  </span>
                </span>
                <span className="mini-section mini-projects-section">
                  <strong className="mini-section-title">Selected Project</strong>
                  <span className="mini-entry-heading"><b>Growth Insights Platform</b><em>2024</em></span>
                  <span className="mini-bullet">Unified reporting for six international teams.</span>
                </span>
              </>
            )}
          </span>

          {hasSidebar && (
            <span className="mini-side-column">
              <span className="mini-section mini-skills-section">
                <strong className="mini-section-title">Skills</strong>
                <span className="mini-skill-list">
                  <span>Strategy</span><span>Research</span><span>Leadership</span><span>Analytics</span>
                </span>
              </span>
              <span className="mini-section">
                <strong className="mini-section-title">Languages</strong>
                <span className="mini-copy">English · Native</span>
                <span className="mini-copy">French · Fluent</span>
              </span>
            </span>
          )}
        </span>

        {template.supportsPhoto && <span className="mini-photo">{profile.initials}</span>}
      </span>
    </span>
  );
}
