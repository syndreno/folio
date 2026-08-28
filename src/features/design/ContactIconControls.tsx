import { CONTACT_ICON_KEYS } from "../../constants/contactIcons";
import type { ContactIconKey, ContactIconUrls } from "../../domain/resume.types";
import { FontAwesomeIconPicker } from "../icons/FontAwesomeIconPicker";

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
        {CONTACT_ICON_KEYS.map((contactKey) => (
          <div className="contact-icon-row" key={contactKey}>
            <span className="contact-icon-label">{CONTACT_LABELS[contactKey]}</span>
            <FontAwesomeIconPicker
              value={contactIconUrls[contactKey]}
              label={CONTACT_LABELS[contactKey]}
              disabled={!showContactIcons}
              onChange={(iconUrl) =>
                onIconUrlsChange({
                  ...contactIconUrls,
                  [contactKey]: iconUrl,
                })
              }
            />
          </div>
        ))}
      </div>
      <p className="icon-persistence-note">
        Selections are saved as official Font Awesome URLs in the downloaded Markdown file.
      </p>
    </fieldset>
  );
}
