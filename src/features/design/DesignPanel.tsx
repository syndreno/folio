import { useMemo, useState } from "react";
import type { TemplateCategory } from "../../constants/resumeTemplates";
import {
  ATS_SAFE_FONTS,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_PAPER_COLOR,
  DEFAULT_TEXT_COLOR,
} from "../../domain/resume.defaults";
import type { ResumeDesignSettings } from "../../domain/resume.types";
import { contrastRatio } from "../../utils/color";
import { ContactIconControls } from "./ContactIconControls";
import { TEMPLATE_DEFINITIONS } from "../templates/registry";
import { PhotoControls } from "../photo/PhotoControls";

interface DesignPanelProps {
  design: ResumeDesignSettings;
  onDesignChange: (patch: Partial<ResumeDesignSettings>) => void;
  photo: string;
  onPhotoChange: (photo: string) => void;
}

const COLOR_PRESETS = ["#1F4E79", "#2F6FED", "#176B55", "#6C4AB6", "#8A3B2E", "#333333"];

const TYPOGRAPHY_PRESETS = [
  {
    name: "Editorial",
    description: "Warm serif headings with a clean ATS-safe body.",
    fontFamily: "Calibri",
    headingFontFamily: "Georgia",
  },
  {
    name: "Contemporary",
    description: "A crisp sans-serif hierarchy for modern roles.",
    fontFamily: "Calibri",
    headingFontFamily: "Calibri",
  },
  {
    name: "Executive",
    description: "Traditional, restrained typography for senior profiles.",
    fontFamily: "Arial",
    headingFontFamily: "Georgia",
  },
] as const;

type TemplateFilter = "all" | TemplateCategory;

const TEMPLATE_FILTERS: Array<{ id: TemplateFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "basic", label: "Basic" },
  { id: "advanced", label: "Advanced" },
  { id: "premium", label: "Premium" },
];

function TemplateMiniature({ template }: { template: (typeof TEMPLATE_DEFINITIONS)[number] }) {
  return (
    <span
      className="template-miniature"
      data-layout={template.layout}
      data-section-style={template.sectionStyle}
      data-skill-style={template.skillStyle}
      data-density={template.density}
      aria-hidden="true"
    >
      <span className="mini-header"><b /><i /><em /></span>
      <span className="mini-contact"><i /><i /><i /></span>
      <span className="mini-section"><b /><i /><i /></span>
      <span className="mini-section mini-section-short"><b /><i /><i /></span>
      {template.supportsPhoto && <span className="mini-photo" />}
    </span>
  );
}

function ColorControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="color-field" htmlFor={id}>
      <span>{label}</span>
      <span className="color-input-row">
        <input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} />
        <input
          className="hex-input"
          value={value}
          pattern="#[0-9A-Fa-f]{6}"
          aria-label={`${label} hexadecimal value`}
          onChange={(event) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(event.target.value)) onChange(event.target.value.toUpperCase());
          }}
        />
      </span>
    </label>
  );
}

export function DesignPanel({
  design,
  onDesignChange,
  photo,
  onPhotoChange,
}: DesignPanelProps) {
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const textContrast = contrastRatio(design.textColor, design.paperColor);
  const accentContrast = contrastRatio(design.accentColor, design.paperColor);
  const visibleTemplates = useMemo(() => {
    const query = templateSearch.trim().toLocaleLowerCase("en");
    return TEMPLATE_DEFINITIONS.filter((template) =>
      (templateFilter === "all" || template.category === templateFilter)
      && (!query || `${template.name} ${template.description} ${template.layout}`
        .toLocaleLowerCase("en")
        .includes(query)),
    );
  }, [templateFilter, templateSearch]);

  return (
    <div className="editor-stack">
      <section className="editor-card">
        <p className="eyebrow">Resume output</p>
        <h2>Page appearance</h2>
        <p className="supporting-copy">
          These choices are saved in your Markdown file and restored when you upload it again.
        </p>

        <div className="template-picker">
          <div className="design-subheading">
            <h3>Template</h3>
            <span>{TEMPLATE_DEFINITIONS.length} professionally configured layouts</span>
          </div>
          <div className="template-gallery-toolbar">
            <div className="template-category-tabs" role="tablist" aria-label="Template categories">
              {TEMPLATE_FILTERS.map((filter) => {
                const count = filter.id === "all"
                  ? TEMPLATE_DEFINITIONS.length
                  : TEMPLATE_DEFINITIONS.filter((template) => template.category === filter.id).length;
                return (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={templateFilter === filter.id}
                    className={templateFilter === filter.id ? "selected" : ""}
                    key={filter.id}
                    onClick={() => setTemplateFilter(filter.id)}
                  >
                    {filter.label} <span>{count}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="search"
              value={templateSearch}
              aria-label="Search resume templates"
              placeholder="Search templates"
              onChange={(event) => setTemplateSearch(event.target.value)}
            />
          </div>
          <div className="template-grid" role="radiogroup" aria-label="Resume template">
            {visibleTemplates.map((template) => (
              <button
                className={
                  template.id === design.templateId ? "template-card selected" : "template-card"
                }
                type="button"
                role="radio"
                aria-checked={template.id === design.templateId}
                key={template.id}
                onClick={() => onDesignChange({ templateId: template.id })}
              >
                <TemplateMiniature template={template} />
                <span className="template-card-copy">
                  <span className="template-card-heading">
                    <strong>{template.name}</strong>
                    <b className={`template-category-badge ${template.category}`}>{template.category}</b>
                  </span>
                  <small>{template.description}</small>
                  <em>
                    {template.atsRating === "optimized"
                      ? "ATS optimized"
                      : template.atsRating === "compatible"
                        ? "ATS compatible"
                        : "Creative"}
                  </em>
                </span>
              </button>
            ))}
          </div>
          {visibleTemplates.length === 0 && (
            <p className="template-empty">No templates match “{templateSearch.trim()}”.</p>
          )}
        </div>

        <PhotoControls
          photo={photo}
          design={design}
          onPhotoChange={onPhotoChange}
          onDesignChange={onDesignChange}
        />

        <div className="design-group">
          <ColorControl
            id="accent-color"
            label="Accent color"
            value={design.accentColor}
            onChange={(accentColor) => onDesignChange({ accentColor })}
          />
          <div className="swatches" aria-label="Accent color presets">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className={color === design.accentColor ? "swatch selected" : "swatch"}
                style={{ backgroundColor: color }}
                onClick={() => onDesignChange({ accentColor: color })}
                aria-label={`Use accent color ${color}`}
              />
            ))}
          </div>
          <ColorControl
            id="paper-color"
            label="Page color"
            value={design.paperColor}
            onChange={(paperColor) => onDesignChange({ paperColor })}
          />
          <ColorControl
            id="text-color"
            label="Text color"
            value={design.textColor}
            onChange={(textColor) => onDesignChange({ textColor })}
          />
          {(textContrast < 4.5 || accentContrast < 3) && (
            <div className="warning" role="status">
              This color combination has low contrast. Choose darker text or a lighter page for readable output.
            </div>
          )}
        </div>

        <div className="typography-presets">
          <div className="design-subheading">
            <h3>Typography presets</h3>
            <span>Curated ATS-safe pairings</span>
          </div>
          <div className="typography-preset-grid">
            {TYPOGRAPHY_PRESETS.map((preset) => {
              const selected = design.fontFamily === preset.fontFamily
                && design.headingFontFamily === preset.headingFontFamily;
              return (
                <button
                  className={selected ? "typography-preset selected" : "typography-preset"}
                  type="button"
                  aria-pressed={selected}
                  key={preset.name}
                  onClick={() => onDesignChange({
                    fontFamily: preset.fontFamily,
                    headingFontFamily: preset.headingFontFamily,
                  })}
                >
                  <strong>{preset.name}</strong>
                  <span>{preset.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="field-grid two-columns">
          <label>
            Body font
            <select
              value={design.fontFamily}
              onChange={(event) => onDesignChange({ fontFamily: event.target.value })}
            >
              {ATS_SAFE_FONTS.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </label>
          <label>
            Heading font
            <select
              value={design.headingFontFamily}
              onChange={(event) => onDesignChange({ headingFontFamily: event.target.value })}
            >
              {ATS_SAFE_FONTS.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </label>
          <label>
            Page size
            <select
              value={design.pageSize}
              onChange={(event) =>
                onDesignChange({ pageSize: event.target.value === "LETTER" ? "LETTER" : "A4" })
              }
            >
              <option value="A4">A4</option>
              <option value="LETTER">US Letter</option>
            </select>
          </label>
          <label>
            Font size <output>{design.fontSize} pt</output>
            <input
              type="range"
              min="9"
              max="14"
              step="0.5"
              value={design.fontSize}
              onChange={(event) => onDesignChange({ fontSize: Number(event.target.value) })}
            />
          </label>
          <label>
            Bullet point size <output>{design.bulletSize} pt</output>
            <input
              type="range"
              min="5"
              max="12"
              step="0.5"
              value={design.bulletSize}
              onChange={(event) => onDesignChange({ bulletSize: Number(event.target.value) })}
            />
          </label>
          <label>
            Line height <output>{design.lineHeight.toFixed(2)}</output>
            <input
              type="range"
              min="1.1"
              max="1.6"
              step="0.05"
              value={design.lineHeight}
              onChange={(event) => onDesignChange({ lineHeight: Number(event.target.value) })}
            />
          </label>
          <label>
            Letter spacing <output>{design.letterSpacing.toFixed(2)} pt</output>
            <input
              type="range"
              min="-0.2"
              max="1"
              step="0.05"
              value={design.letterSpacing}
              onChange={(event) => onDesignChange({ letterSpacing: Number(event.target.value) })}
            />
          </label>
          <label>
            Heading size <output>{design.headingSize} pt</output>
            <input type="range" min="9" max="16" step="0.5" value={design.headingSize} onChange={(event) => onDesignChange({ headingSize: Number(event.target.value) })} />
          </label>
          <label>
            Section spacing <output>{design.sectionSpacing} pt</output>
            <input type="range" min="8" max="28" step="1" value={design.sectionSpacing} onChange={(event) => onDesignChange({ sectionSpacing: Number(event.target.value) })} />
          </label>
          <label>
            Entry spacing <output>{design.entrySpacing} pt</output>
            <input type="range" min="2" max="16" step="1" value={design.entrySpacing} onChange={(event) => onDesignChange({ entrySpacing: Number(event.target.value) })} />
          </label>
          <label>
            Page margin <output>{design.pageMargin} mm</output>
            <input type="range" min="8" max="25" step="1" value={design.pageMargin} onChange={(event) => onDesignChange({ pageMargin: Number(event.target.value) })} />
          </label>
        </div>
        <ContactIconControls
          showContactIcons={design.showContactIcons}
          contactIconUrls={design.contactIconUrls}
          onVisibilityChange={(showContactIcons) => onDesignChange({ showContactIcons })}
          onIconUrlsChange={(contactIconUrls) => onDesignChange({ contactIconUrls })}
        />
        <button
          className="text-button"
          type="button"
          onClick={() =>
            onDesignChange({
              accentColor: DEFAULT_ACCENT_COLOR,
              paperColor: DEFAULT_PAPER_COLOR,
              textColor: DEFAULT_TEXT_COLOR,
              fontFamily: "Calibri",
              headingFontFamily: "Georgia",
              fontSize: 10.5,
              bulletSize: 8,
              lineHeight: 1.25,
              letterSpacing: 0,
              sectionSpacing: 15,
              entrySpacing: 7,
              pageMargin: 18,
              headingSize: 10,
              showContactIcons: true,
              showPhoto: false,
              photoShape: "circle",
              photoZoom: 1,
              photoPositionX: 50,
              photoPositionY: 50,
            })
          }
        >
          Reset resume appearance
        </button>
      </section>

    </div>
  );
}
