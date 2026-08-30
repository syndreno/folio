import { useMemo, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import type { ResumeTemplateId } from "../../domain/resume.types";
import { SiteFooter } from "../../components/SiteFooter";
import {
  TEMPLATE_DEFINITIONS,
  type ResumeTemplateAudience,
  type ResumeTemplateDefinition,
  type ResumeTemplateFormat,
} from "./registry";
import { TemplateMiniature } from "./TemplateMiniature";

type AtsFilter = "all" | ResumeTemplateDefinition["atsRating"];
type FormatFilter = "all" | ResumeTemplateFormat;
type AudienceFilter = "all" | ResumeTemplateAudience;

const FORMAT_FILTERS: Array<{ value: FormatFilter; label: string }> = [
  { value: "all", label: "All formats" },
  { value: "chronological", label: "Chronological" },
  { value: "functional", label: "Skill-first" },
  { value: "combination", label: "Combination" },
];

const AUDIENCE_FILTERS: Array<{ value: AudienceFilter; label: string }> = [
  { value: "all", label: "Every career" },
  { value: "general", label: "General" },
  { value: "student", label: "Student" },
  { value: "technology", label: "Technology" },
  { value: "executive", label: "Executive" },
  { value: "creative", label: "Creative" },
  { value: "academic", label: "Academic" },
  { value: "service", label: "Service" },
];

const ATS_FILTERS: Array<{ value: AtsFilter; label: string }> = [
  { value: "all", label: "Every ATS rating" },
  { value: "optimized", label: "ATS optimized" },
  { value: "compatible", label: "ATS compatible" },
  { value: "creative", label: "Creative" },
];

const LAYOUT_FAMILY_LEADERS: ResumeTemplateId[] = [
  "classic",
  "clean-slate",
  "civic",
  "catalyst",
  "graduate",
  "engineer",
  "portfolio",
  "healthcare-basic",
  "modern",
  "clearpath",
  "precision",
  "product",
  "editorial",
  "executive",
];

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function TemplateCatalogPage({
  selectedTemplateId,
  hasOpenResume,
  onBack,
  onHome,
  onUseTemplate,
  headerActions,
}: {
  selectedTemplateId: ResumeTemplateId;
  hasOpenResume: boolean;
  onBack: () => void;
  onHome: () => void;
  onUseTemplate: (templateId: ResumeTemplateId) => void;
  headerActions?: ReactNode;
}) {
  const [focusedTemplateId, setFocusedTemplateId] = useState<ResumeTemplateId>(selectedTemplateId);
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [atsRating, setAtsRating] = useState<AtsFilter>("all");

  const visibleTemplates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("en");
    return TEMPLATE_DEFINITIONS.filter((template) => {
      const searchable = [
        template.name,
        template.description,
        template.category,
        template.format,
        template.audience,
        template.layoutFamily,
      ].join(" ").toLocaleLowerCase("en");
      return (!query || searchable.includes(query))
        && (format === "all" || template.format === format)
        && (audience === "all" || template.audience === audience)
        && (atsRating === "all" || template.atsRating === atsRating);
    }).sort((first, second) => {
      const firstPriority = LAYOUT_FAMILY_LEADERS.indexOf(first.id);
      const secondPriority = LAYOUT_FAMILY_LEADERS.indexOf(second.id);
      if (firstPriority >= 0 || secondPriority >= 0) {
        if (firstPriority < 0) return 1;
        if (secondPriority < 0) return -1;
        return firstPriority - secondPriority;
      }
      return 0;
    });
  }, [atsRating, audience, format, search]);

  const focusedTemplate = TEMPLATE_DEFINITIONS.find(
    (template) => template.id === focusedTemplateId,
  ) ?? TEMPLATE_DEFINITIONS[0];

  return (
    <div className="template-catalog-shell">
      <header className="template-page-header">
        <button className="brand brand-button" type="button" onClick={onHome}>
          <span className="brand-mark">F</span><span>Folio</span>
        </button>
        <button className="template-back-button" type="button" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          {hasOpenResume ? "Back to editor" : "Back to home"}
        </button>
        <div className="template-page-actions">{headerActions}</div>
      </header>

      <main className="template-catalog-main">
        <section className="template-catalog-intro">
          <div>
            <p className="eyebrow">Professional resume layouts</p>
            <h1>Choose the structure that tells your story best.</h1>
            <p>
              Filter by resume format and career type. Colors, fonts, and spacing remain
              customizable after you choose a layout.
            </p>
          </div>
          <div className="template-catalog-summary" aria-label="Template catalog summary">
            <strong>{TEMPLATE_DEFINITIONS.length}</strong>
            <span>configurations across {new Set(TEMPLATE_DEFINITIONS.map((template) => template.layoutFamily)).size} layout families</span>
          </div>
        </section>

        <section className="template-filter-panel" aria-label="Filter resume templates">
          <label className="template-search-field">
            <span className="sr-only">Search resume templates</span>
            <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
            <input
              type="search"
              value={search}
              placeholder="Search by name, role, or style"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            <span>Format</span>
            <select value={format} onChange={(event) => setFormat(event.target.value as FormatFilter)}>
              {FORMAT_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
            </select>
          </label>
          <label>
            <span>Career type</span>
            <select value={audience} onChange={(event) => setAudience(event.target.value as AudienceFilter)}>
              {AUDIENCE_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
            </select>
          </label>
          <label>
            <span>ATS level</span>
            <select value={atsRating} onChange={(event) => setAtsRating(event.target.value as AtsFilter)}>
              {ATS_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
            </select>
          </label>
        </section>

        <div className="template-results-heading">
          <h2>{visibleTemplates.length} templates</h2>
          <span>Template changes never alter your resume content.</span>
        </div>

        {visibleTemplates.length > 0 ? (
          <section className="template-catalog-grid" aria-label="Resume templates">
            {visibleTemplates.map((template) => {
              const isFocused = template.id === focusedTemplateId;
              const isCurrent = hasOpenResume && template.id === selectedTemplateId;
              return (
                <article className={isFocused ? "catalog-template-card selected" : "catalog-template-card"} key={template.id}>
                  <button
                    className="catalog-template-preview"
                    type="button"
                    aria-label={`Preview ${template.name}`}
                    aria-pressed={isFocused}
                    onClick={() => setFocusedTemplateId(template.id)}
                  >
                    <TemplateMiniature template={template} large />
                    {isCurrent && <span className="current-template-badge"><FontAwesomeIcon icon={faCheck} /> Current</span>}
                  </button>
                  <div className="catalog-template-copy">
                    <div>
                      <span className={`template-category-badge ${template.category}`}>{template.category}</span>
                      <span className={`ats-template-badge ${template.atsRating}`}>{formatLabel(template.atsRating)}</span>
                    </div>
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                    <dl>
                      <div><dt>Format</dt><dd>{formatLabel(template.format)}</dd></div>
                      <div><dt>Best for</dt><dd>{formatLabel(template.audience)}</dd></div>
                    </dl>
                    <button
                      className={isFocused ? "primary-button" : "secondary-button"}
                      type="button"
                      onClick={() => {
                        setFocusedTemplateId(template.id);
                        onUseTemplate(template.id);
                      }}
                    >
                      {isCurrent ? "Keep this template" : `Use ${template.name}`}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="template-catalog-empty">
            <h2>No matching templates</h2>
            <p>Try a broader career type or ATS filter.</p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSearch("");
                setFormat("all");
                setAudience("all");
                setAtsRating("all");
              }}
            >
              Clear filters
            </button>
          </section>
        )}

        {focusedTemplate && (
          <aside className="template-selection-dock" aria-live="polite">
            <div>
              <span>Selected layout</span>
              <strong>{focusedTemplate.name}</strong>
            </div>
            <button className="primary-button" type="button" onClick={() => onUseTemplate(focusedTemplate.id)}>
              {hasOpenResume ? "Apply and return to editor" : "Use template and start"}
            </button>
          </aside>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
