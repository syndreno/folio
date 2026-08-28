import { useEffect, useId, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  SUPPORTED_FONT_AWESOME_ICON_NAMES,
  createFontAwesomeIconUrl,
  formatFontAwesomeIconName,
  getFontAwesomeIconName,
} from "../../constants/contactIcons";
import { getFontAwesomeIconDefinition } from "./fontAwesomeRegistry";

export function FontAwesomeIconPicker({
  value,
  label,
  disabled = false,
  onChange,
}: {
  value: string;
  label: string;
  disabled?: boolean;
  onChange: (iconUrl: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const gridId = useId();
  const selectedIconName = getFontAwesomeIconName(value);
  const selectedIcon = getFontAwesomeIconDefinition(value);

  useEffect(() => {
    if (!open) return;

    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selectIcon = (iconUrl: string) => {
    onChange(iconUrl);
    setOpen(false);
  };

  return (
    <div className="icon-picker" ref={pickerRef}>
      <button
        className="icon-picker-trigger"
        type="button"
        disabled={disabled}
        aria-label={`${label} icon picker`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={gridId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="icon-picker-trigger-preview" aria-hidden="true">
          {selectedIcon ? <FontAwesomeIcon icon={selectedIcon} /> : "—"}
        </span>
        <span>{selectedIconName ? formatFontAwesomeIconName(selectedIconName) : "No icon"}</span>
        <span className="icon-picker-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="icon-picker-popover" id={gridId} role="listbox" aria-label={`${label} icons`}>
          <button
            className={!selectedIconName ? "icon-picker-option selected" : "icon-picker-option"}
            type="button"
            role="option"
            aria-selected={!selectedIconName}
            aria-label={`Use no icon for ${label}`}
            title="No icon"
            onClick={() => selectIcon("")}
          >
            <span className="icon-picker-none" aria-hidden="true">None</span>
          </button>
          {SUPPORTED_FONT_AWESOME_ICON_NAMES.map((iconName) => {
            const iconUrl = createFontAwesomeIconUrl(iconName);
            const icon = getFontAwesomeIconDefinition(iconUrl);
            const iconLabel = formatFontAwesomeIconName(iconName);
            return (
              <button
                className={selectedIconName === iconName ? "icon-picker-option selected" : "icon-picker-option"}
                type="button"
                role="option"
                aria-selected={selectedIconName === iconName}
                aria-label={`Use ${iconLabel} icon for ${label}`}
                title={iconLabel}
                key={iconName}
                onClick={() => selectIcon(iconUrl)}
              >
                {icon && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
