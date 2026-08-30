import { useMemo, useState, type CSSProperties } from "react";
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
import { TemplateMiniature } from "../templates/TemplateMiniature";
import { PhotoControls } from "../photo/PhotoControls";

interface DesignPanelProps {
  design: ResumeDesignSettings;
  onDesignChange: (patch: Partial<ResumeDesignSettings>) => void;
  photo: string;
  onPhotoChange: (photo: string) => void;
  onBrowseTemplates: () => void;
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
  onBrowseTemplates,
}: DesignPanelProps) {
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<"all" | "basic" | "advanced" | "premium">("all");
  const textContrast = contrastRatio(design.textColor, design.paperColor);
  const accentContrast = contrastRatio(design.accentColor, design.paperColor);
  const selectedTemplate = TEMPLATE_DEFINITIONS.find(
    (template) => template.id === design.templateId,
  ) ?? TEMPLATE_DEFINITIONS[0]!;
  const selectedTemplateIndex = TEMPLATE_DEFINITIONS.findIndex(
    (template) => template.id === selectedTemplate.id,
  );
  const quickTemplates = useMemo(() => {
    const query = templateSearch.trim().toLocaleLowerCase("en");
    return TEMPLATE_DEFINITIONS.filter((template) => (
      (templateCategory === "all" || template.category === templateCategory)
      && (!query || [
        template.name,
        template.description,
        template.audience,
        template.format,
      ].join(" ").toLocaleLowerCase("en").includes(query))
    ));
  }, [templateCategory, templateSearch]);

  const applyTemplate = (template: (typeof TEMPLATE_DEFINITIONS)[number]) => {
    onDesignChange({
      templateId: template.id,
      ...template.visualPreset,
    });
  };

  const moveTemplate = (offset: number) => {
    const nextIndex = (selectedTemplateIndex + offset + TEMPLATE_DEFINITIONS.length)
      % TEMPLATE_DEFINITIONS.length;
    const nextTemplate = TEMPLATE_DEFINITIONS[nextIndex];
    if (nextTemplate) applyTemplate(nextTemplate);
  };

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
            <span>Switch here while watching the live preview</span>
          </div>
          <div
            className="selected-template-card"
            style={{ "--selected-template-accent": selectedTemplate.visualPreset.accentColor } as CSSProperties}
          >
            <TemplateMiniature template={selectedTemplate} />
            <div>
              <span className={`template-category-badge ${selectedTemplate.category}`}>
                {selectedTemplate.category}
              </span>
              <h4>{selectedTemplate.name}</h4>
              <p>{selectedTemplate.description}</p>
              <small>{selectedTemplate.format} · {selectedTemplate.atsRating}</small>
            </div>
          </div>
          <div className="quick-template-actions">
            <button type="button" onClick={() => moveTemplate(-1)} aria-label="Use previous template">
              ← Previous
            </button>
            <button
              className="quick-template-toggle"
              type="button"
              aria-expanded={showQuickTemplates}
              onClick={() => setShowQuickTemplates((current) => !current)}
            >
              {showQuickTemplates ? "Close quick switcher" : "Quick switch template"}
            </button>
            <button type="button" onClick={() => moveTemplate(1)} aria-label="Use next template">
              Next →
            </button>
          </div>
          {showQuickTemplates && (
            <div className="quick-template-panel">
              <input
                type="search"
                value={templateSearch}
                placeholder="Search templates"
                aria-label="Search quick templates"
                onChange={(event) => setTemplateSearch(event.target.value)}
              />
              <div className="quick-template-tabs" aria-label="Quick template categories">
                {(["all", "basic", "advanced", "premium"] as const).map((category) => (
                  <button
                    className={templateCategory === category ? "selected" : ""}
                    type="button"
                    key={category}
                    aria-pressed={templateCategory === category}
                    onClick={() => setTemplateCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="quick-template-grid">
                {quickTemplates.map((template) => (
                  <button
                    className={template.id === design.templateId ? "quick-template-card selected" : "quick-template-card"}
                    type="button"
                    key={template.id}
                    data-template-id={template.id}
                    aria-pressed={template.id === design.templateId}
                    style={{ "--quick-template-accent": template.visualPreset.accentColor } as CSSProperties}
                    onClick={() => applyTemplate(template)}
                  >
                    <TemplateMiniature template={template} />
                    <span>
                      <strong>{template.name}</strong>
                      <small>{template.category} · {template.atsRating}</small>
                    </span>
                  </button>
                ))}
              </div>
              {quickTemplates.length === 0 && <p className="template-empty">No matching templates.</p>}
            </div>
          )}
          <button className="secondary-button full-width" type="button" onClick={onBrowseTemplates}>
            Browse all {TEMPLATE_DEFINITIONS.length} templates in full gallery
          </button>
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
