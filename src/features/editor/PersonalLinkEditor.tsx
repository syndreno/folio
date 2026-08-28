import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  SUPPORTED_FONT_AWESOME_ICON_NAMES,
  createFontAwesomeIconUrl,
  formatFontAwesomeIconName,
  getFontAwesomeIconName,
  type SupportedFontAwesomeIconName,
} from "../../constants/contactIcons";
import type { PersonalLink } from "../../domain/resume.types";
import { getFontAwesomeIconDefinition } from "../icons/fontAwesomeRegistry";

export function PersonalLinkEditor({
  link,
  onChange,
  onDelete,
}: {
  link: PersonalLink;
  onChange: (patch: Partial<PersonalLink>) => void;
  onDelete: () => void;
}) {
  const selectedIconName = getFontAwesomeIconName(link.iconUrl) ?? "";
  const icon = getFontAwesomeIconDefinition(link.iconUrl);

  return (
    <fieldset className="personal-link-card">
      <legend>Custom link</legend>
      <div className="field-grid two-columns">
        <label>
          Header
          <input
            value={link.header}
            placeholder="Portfolio"
            onChange={(event) => onChange({ header: event.target.value })}
          />
        </label>
        <label>
          Content
          <input
            value={link.content}
            placeholder="portfolio.example.com"
            onChange={(event) => onChange({ content: event.target.value })}
          />
        </label>
      </div>
      <label>
        Link URL
        <input
          type="url"
          value={link.url}
          placeholder="https://portfolio.example.com"
          onChange={(event) => onChange({ url: event.target.value })}
        />
      </label>
      <label className="personal-link-icon-field">
        <span>Icon</span>
        <span className="personal-link-icon-row">
          <span className="icon-preview" aria-hidden="true">
            {icon ? <FontAwesomeIcon icon={icon} /> : "—"}
          </span>
          <select
            value={selectedIconName}
            aria-label={`${link.header || "Custom link"} icon`}
            onChange={(event) => {
              const iconName = event.target.value as SupportedFontAwesomeIconName | "";
              onChange({ iconUrl: iconName ? createFontAwesomeIconUrl(iconName) : "" });
            }}
          >
            <option value="">No icon</option>
            {SUPPORTED_FONT_AWESOME_ICON_NAMES.map((iconName) => (
              <option value={iconName} key={iconName}>
                {formatFontAwesomeIconName(iconName)}
              </option>
            ))}
          </select>
        </span>
      </label>
      <button className="text-button danger" type="button" onClick={onDelete}>
        Delete custom link
      </button>
    </fieldset>
  );
}
