import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import type {
  PersonalDetails,
  PersonalLink,
  ResumeDocument,
  ResumeSection,
  ResumeSectionItem,
} from "../../domain/resume.types";
import { PersonalLinkEditor } from "./PersonalLinkEditor";
import { parseBulletDraft } from "./bulletDraft";

type PersonalTextField = Exclude<keyof PersonalDetails, "customLinks">;

interface ResumeEditorProps {
  resume: ResumeDocument;
  onPersonalChange: (field: PersonalTextField, value: string) => void;
  onPersonalLinkAdd: () => void;
  onPersonalLinkChange: (linkId: string, patch: Partial<PersonalLink>) => void;
  onPersonalLinkDelete: (linkId: string) => void;
  onSectionChange: (sectionId: string, patch: Partial<ResumeSection>) => void;
  onItemChange: (
    sectionId: string,
    itemId: string,
    patch: Partial<ResumeSectionItem>,
  ) => void;
  onAddItem: (sectionId: string) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onDuplicateSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddSection: () => void;
}

const PERSONAL_FIELDS: ReadonlyArray<{
  key: PersonalTextField;
  label: string;
  type?: string;
  placeholder?: string;
}> = [
  { key: "fullName", label: "Full name" },
  { key: "professionalTitle", label: "Professional title" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "location", label: "Location" },
  { key: "website", label: "Website", type: "url", placeholder: "https://example.com" },
  { key: "linkedin", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/name" },
  { key: "github", label: "GitHub", type: "url", placeholder: "https://github.com/name" },
];

const SIMPLE_LIST_TYPES = new Set([
  "skills",
  "certifications",
  "languages",
  "achievements",
  "awards",
  "interests",
]);

function EntryEditor({
  item,
  simple,
  onChange,
  onDelete,
}: {
  item: ResumeSectionItem;
  simple: boolean;
  onChange: (patch: Partial<ResumeSectionItem>) => void;
  onDelete: () => void;
}) {
  const [bulletDraft, setBulletDraft] = useState(() => item.bullets.join("\n"));

  if (simple) {
    return (
      <div className="inline-entry">
        <label className="sr-only" htmlFor={`${item.id}-title`}>
          List item
        </label>
        <input
          id={`${item.id}-title`}
          value={item.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <button className="icon-button danger" type="button" onClick={onDelete} aria-label="Delete item">
          ×
        </button>
      </div>
    );
  }

  return (
    <fieldset className="entry-card">
      <legend>Entry</legend>
      <div className="field-grid two-columns">
        <label>
          Title
          <input value={item.title} onChange={(event) => onChange({ title: event.target.value })} />
        </label>
        <label>
          Organization or subtitle
          <input
            value={item.subtitle}
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
        </label>
      </div>
      <label>
        Dates and location
        <input
          value={item.meta}
          placeholder="January 2024 - Present | City"
          onChange={(event) => onChange({ meta: event.target.value })}
        />
      </label>
      <label>
        Description
        <textarea
          rows={2}
          value={item.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <label>
        Bullets <span className="label-hint">One per line</span>
        <textarea
          rows={4}
          value={bulletDraft}
          onChange={(event) => {
            setBulletDraft(event.target.value);
            onChange({ bullets: parseBulletDraft(event.target.value) });
          }}
        />
      </label>
      <button className="text-button danger" type="button" onClick={onDelete}>
        Delete entry
      </button>
    </fieldset>
  );
}

export function ResumeEditor({
  resume,
  onPersonalChange,
  onPersonalLinkAdd,
  onPersonalLinkChange,
  onPersonalLinkDelete,
  onSectionChange,
  onItemChange,
  onAddItem,
  onDeleteItem,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  onAddSection,
}: ResumeEditorProps) {
  const sections = [...resume.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="editor-stack">
      <section className="editor-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Essentials</p>
            <h2>Personal details</h2>
          </div>
        </div>
        <div className="field-grid two-columns">
          {PERSONAL_FIELDS.map((field) => (
            <label key={field.key}>
              {field.label}
              <input
                type={field.type ?? "text"}
                value={resume.personal[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => onPersonalChange(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>
        <div className="personal-links-editor">
          <div className="personal-links-heading">
            <div>
              <h3>Additional links</h3>
              <p>Add a portfolio, blog, social profile, or another relevant link.</p>
            </div>
            <button
              className="secondary-button compact-button"
              type="button"
              disabled={resume.personal.customLinks.length >= 20}
              onClick={onPersonalLinkAdd}
            >
              + Add link
            </button>
          </div>
          {resume.personal.customLinks.map((link) => (
            <PersonalLinkEditor
              link={link}
              key={link.id}
              onChange={(patch) => onPersonalLinkChange(link.id, patch)}
              onDelete={() => onPersonalLinkDelete(link.id)}
            />
          ))}
          {resume.personal.customLinks.length === 0 && (
            <p className="empty-link-note">
              No additional links yet. Each link can have its own title, URL, and icon.
            </p>
          )}
        </div>
      </section>

      {sections.map((section, index) => {
        const simple = SIMPLE_LIST_TYPES.has(section.type);
        return (
          <section className="editor-card" data-editor-section-id={section.id} key={section.id}>
            <div className="section-toolbar">
              <label className="grow-field">
                Section title
                <input
                  value={section.title}
                  onChange={(event) => onSectionChange(section.id, { title: event.target.value })}
                />
              </label>
              <div className="toolbar-actions" aria-label={`${section.title} actions`}>
                <button
                  className="icon-button"
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveSection(section.id, -1)}
                  aria-label={`Move ${section.title} up`}
                >
                  ↑
                </button>
                <button
                  className="icon-button"
                  type="button"
                  disabled={index === sections.length - 1}
                  onClick={() => onMoveSection(section.id, 1)}
                  aria-label={`Move ${section.title} down`}
                >
                  ↓
                </button>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => onSectionChange(section.id, { visible: !section.visible })}
                >
                  {section.visible ? "Hide" : "Show"}
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => onDuplicateSection(section.id)}
                  aria-label={`Copy ${section.title}`}
                  title={`Copy ${section.title}`}
                >
                  <FontAwesomeIcon icon={faCopy} aria-hidden="true" />
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => onDeleteSection(section.id)}
                  aria-label={`Delete ${section.title}`}
                >
                  ×
                </button>
              </div>
            </div>
            {!section.visible && <p className="notice compact">Hidden from preview and visual exports.</p>}
            {section.type === "summary" ? (
              <label>
                Summary
                <textarea
                  rows={6}
                  value={section.content}
                  onChange={(event) => onSectionChange(section.id, { content: event.target.value })}
                />
              </label>
            ) : (
              <div className="entry-list">
                {section.items.map((item) => (
                  <EntryEditor
                    key={item.id}
                    item={item}
                    simple={simple}
                    onChange={(patch) => onItemChange(section.id, item.id, patch)}
                    onDelete={() => onDeleteItem(section.id, item.id)}
                  />
                ))}
                <button className="secondary-button full-width" type="button" onClick={() => onAddItem(section.id)}>
                  + Add {simple ? "item" : "entry"}
                </button>
              </div>
            )}
          </section>
        );
      })}

      <button className="secondary-button add-section" type="button" onClick={onAddSection}>
        + Add custom section
      </button>
    </div>
  );
}
