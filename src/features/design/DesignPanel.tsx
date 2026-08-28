import {
  ATS_SAFE_FONTS,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_PAPER_COLOR,
  DEFAULT_TEXT_COLOR,
} from "../../domain/resume.defaults";
import type { ResumeDesignSettings } from "../../domain/resume.types";
import { contrastRatio } from "../../utils/color";
import { ContactIconControls } from "./ContactIconControls";

interface DesignPanelProps {
  design: ResumeDesignSettings;
  onDesignChange: (patch: Partial<ResumeDesignSettings>) => void;
}

const COLOR_PRESETS = ["#1F4E79", "#2F6FED", "#176B55", "#6C4AB6", "#8A3B2E", "#333333"];

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
}: DesignPanelProps) {
  const textContrast = contrastRatio(design.textColor, design.paperColor);
  const accentContrast = contrastRatio(design.accentColor, design.paperColor);

  return (
    <div className="editor-stack">
      <section className="editor-card">
        <p className="eyebrow">Resume output</p>
        <h2>Page appearance</h2>
        <p className="supporting-copy">
          These choices are saved in your Markdown file and restored when you upload it again.
        </p>

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
              fontFamily: "Arial",
              headingFontFamily: "Georgia",
              fontSize: 10.5,
              bulletSize: 8,
              lineHeight: 1.25,
              showContactIcons: true,
            })
          }
        >
          Reset resume appearance
        </button>
      </section>

    </div>
  );
}
