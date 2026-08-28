import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CONTACT_ICON_KEYS,
  SUPPORTED_FONT_AWESOME_ICON_NAMES,
  createFontAwesomeIconUrl,
  formatFontAwesomeIconName,
  getFontAwesomeIconName,
  type SupportedFontAwesomeIconName,
} from "../../constants/contactIcons";
import type { ContactIconKey, ContactIconUrls } from "../../domain/resume.types";
import { getFontAwesomeIconDefinition } from "../icons/fontAwesomeRegistry";

const CONTACT_LABELS: Readonly<Record<ContactIconKey, string>> = {
  email: "Email",
  phone: "Phone",
  location: "Location",
  website: "Website",
  linkedin: "LinkedIn",
  github: "GitHub",
};

export function ContactIconControls({
  showContactIcons,
  contactIconUrls,
  onVisibilityChange,
  onIconUrlsChange,
}: {
  showContactIcons: boolean;
  contactIconUrls: ContactIconUrls;
  onVisibilityChange: (visible: boolean) => void;
  onIconUrlsChange: (urls: ContactIconUrls) => void;
}) {
  return (
    <fieldset className="contact-icon-controls">
      <legend>Contact icons</legend>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={showContactIcons}
          onChange={(event) => onVisibilityChange(event.target.checked)}
        />
        <span>
          Show contact icons
          <small>Icons remain paired with readable contact text for ATS compatibility.</small>
        </span>
      </label>

      <div className="contact-icon-grid" aria-disabled={!showContactIcons}>
        {CONTACT_ICON_KEYS.map((contactKey) => {
          const url = contactIconUrls[contactKey];
          const selectedName = getFontAwesomeIconName(url) ?? "";
          const icon = getFontAwesomeIconDefinition(url);
          return (
            <label className="contact-icon-row" key={contactKey}>
              <span className="contact-icon-label">{CONTACT_LABELS[contactKey]}</span>
              <span className="icon-preview" aria-hidden="true">
                {icon ? <FontAwesomeIcon icon={icon} /> : "—"}
              </span>
              <select
                value={selectedName}
                disabled={!showContactIcons}
                aria-label={`${CONTACT_LABELS[contactKey]} icon`}
                onChange={(event) => {
                  const nextName = event.target.value as SupportedFontAwesomeIconName | "";
                  onIconUrlsChange({
                    ...contactIconUrls,
                    [contactKey]: nextName ? createFontAwesomeIconUrl(nextName) : "",
                  });
                }}
              >
                <option value="">No icon</option>
                {SUPPORTED_FONT_AWESOME_ICON_NAMES.map((iconName) => (
                  <option key={iconName} value={iconName}>{formatFontAwesomeIconName(iconName)}</option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
      <p className="icon-persistence-note">
        Selections are saved as official Font Awesome URLs in the downloaded Markdown file.
      </p>
    </fieldset>
  );
}
