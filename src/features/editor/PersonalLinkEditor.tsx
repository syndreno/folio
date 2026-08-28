import type { PersonalLink } from "../../domain/resume.types";
import { FontAwesomeIconPicker } from "../icons/FontAwesomeIconPicker";

export function PersonalLinkEditor({
  link,
  onChange,
  onDelete,
}: {
  link: PersonalLink;
  onChange: (patch: Partial<PersonalLink>) => void;
  onDelete: () => void;
}) {
  return (
    <fieldset className="personal-link-card">
      <legend>Custom link</legend>
      <div className="field-grid two-columns">
        <label>
          Title
          <input
            value={link.title}
            placeholder="Portfolio"
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>
        <label>
          Link URL
          <input
            type="url"
            value={link.url}
            placeholder="https://portfolio.example.com"
            onChange={(event) => onChange({ url: event.target.value })}
          />
        </label>
      </div>
      <div className="personal-link-icon-field">
        <span>Icon</span>
        <FontAwesomeIconPicker
          value={link.iconUrl}
          label={link.title || "Custom link"}
          onChange={(iconUrl) => onChange({ iconUrl })}
        />
      </div>
      <button className="text-button danger" type="button" onClick={onDelete}>
        Delete custom link
      </button>
    </fieldset>
  );
}
