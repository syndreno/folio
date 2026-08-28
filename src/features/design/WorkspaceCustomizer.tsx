import { faDesktop, faMoon, faPalette, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ATS_SAFE_FONTS } from "../../domain/resume.defaults";

export interface WorkspaceSettings {
  accentColor: string;
  fontFamily: string;
  letterSpacing: number;
  lineHeight: number;
  themeMode: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
}

export function WorkspaceCustomizer({
  workspace,
  onChange,
}: {
  workspace: WorkspaceSettings;
  onChange: (patch: Partial<WorkspaceSettings>) => void;
}) {
  return (
    <details className="workspace-customizer">
      <summary
        className="secondary-button compact-button appearance-trigger"
        aria-label="Customize site appearance"
        title="Customize site appearance"
      >
        <FontAwesomeIcon icon={faPalette} aria-hidden="true" />
        <span className="sr-only">Customize site appearance</span>
      </summary>
      <div className="appearance-popover">
        <div className="popover-heading">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>Site appearance</h2>
          </div>
          <span className="local-badge">Local only</span>
        </div>
        <p>These controls change the website interface, not your exported resume.</p>
        <fieldset className="appearance-fieldset">
          <legend>Color mode</legend>
          <div className="segmented-control">
            {([
              ["light", faSun, "Day"],
              ["dark", faMoon, "Night"],
              ["system", faDesktop, "System"],
            ] as const).map(([mode, icon, label]) => (
              <button
                key={mode}
                type="button"
                className={workspace.themeMode === mode ? "active" : ""}
                aria-pressed={workspace.themeMode === mode}
                onClick={() => onChange({ themeMode: mode })}
              >
                <FontAwesomeIcon icon={icon} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Website color
          <span className="header-color-row">
            <input
              type="color"
              value={workspace.accentColor}
              onChange={(event) => onChange({ accentColor: event.target.value.toUpperCase() })}
            />
            <input
              className="hex-input"
              value={workspace.accentColor}
              aria-label="Website color hexadecimal value"
              onChange={(event) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(event.target.value)) {
                  onChange({ accentColor: event.target.value.toUpperCase() });
                }
              }}
            />
          </span>
        </label>
        <label>
          Website font
          <select
            value={workspace.fontFamily}
            onChange={(event) => onChange({ fontFamily: event.target.value })}
          >
            {ATS_SAFE_FONTS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </label>
        <label>
          Letter spacing <output>{workspace.letterSpacing.toFixed(1)} px</output>
          <input
            type="range"
            min="-0.5"
            max="2"
            step="0.1"
            value={workspace.letterSpacing}
            onChange={(event) => onChange({ letterSpacing: Number(event.target.value) })}
          />
        </label>
        <label>
          Line spacing <output>{workspace.lineHeight.toFixed(2)}</output>
          <input
            type="range"
            min="1.2"
            max="1.8"
            step="0.05"
            value={workspace.lineHeight}
            onChange={(event) => onChange({ lineHeight: Number(event.target.value) })}
          />
        </label>
        <fieldset className="appearance-fieldset">
          <legend>Interface density</legend>
          <div className="segmented-control two-options">
            {(["comfortable", "compact"] as const).map((density) => (
              <button
                key={density}
                type="button"
                className={workspace.density === density ? "active" : ""}
                aria-pressed={workspace.density === density}
                onClick={() => onChange({ density })}
              >
                {density === "comfortable" ? "Comfortable" : "Compact"}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="checkbox-field appearance-checkbox">
          <input
            type="checkbox"
            checked={workspace.reduceMotion}
            onChange={(event) => onChange({ reduceMotion: event.target.checked })}
          />
          <span>
            Reduce motion
            <small>Turns off interface transitions and movement.</small>
          </span>
        </label>
        <button
          className="text-button"
          type="button"
          onClick={() =>
            onChange({
              accentColor: "#245B4E",
              fontFamily: "Arial",
              letterSpacing: 0,
              lineHeight: 1.5,
              themeMode: "system",
              density: "comfortable",
              reduceMotion: false,
            })
          }
        >
          Reset site appearance
        </button>
      </div>
    </details>
  );
}
