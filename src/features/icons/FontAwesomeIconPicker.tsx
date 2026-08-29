import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  createFontAwesomeIconUrl,
  formatFontAwesomeIconName,
  getFontAwesomeIconReference,
} from "../../constants/contactIcons";
import {
  registerFontAwesomeIconDefinition,
} from "./fontAwesomeRegistry";
import type { FontAwesomeIconOption } from "./fontAwesomeCatalog";
import { useFontAwesomeIconDefinition } from "./useFontAwesomeIconDefinition";

const INITIAL_ICON_LIMIT = 160;
const ICON_LIMIT_INCREMENT = 160;

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
  const [search, setSearch] = useState("");
  const [iconOptions, setIconOptions] = useState<FontAwesomeIconOption[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_ICON_LIMIT);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridId = useId();
  const selectedIcon = useFontAwesomeIconDefinition(value);
  const selectedReference = getFontAwesomeIconReference(value);
  const selectedIconName = selectedIcon?.iconName ?? selectedReference?.iconName;
  const normalizedSearch = search.trim().toLocaleLowerCase("en");
  const visibleIcons = useMemo(
    () => normalizedSearch
      ? iconOptions.filter((option) => option.searchText.includes(normalizedSearch))
      : iconOptions,
    [iconOptions, normalizedSearch],
  );
  const renderedIcons = visibleIcons.slice(0, visibleLimit);

  useEffect(() => {
    if (!open || iconOptions.length > 0) return;
    let active = true;
    void import("./fontAwesomeCatalog").then((catalog) => {
      if (active) setIconOptions(catalog.FONT_AWESOME_ICON_OPTIONS);
    });
    return () => {
      active = false;
    };
  }, [iconOptions.length, open]);

  useEffect(() => {
    if (!open) return;

    const focusFrame = window.requestAnimationFrame(() => searchRef.current?.focus());

    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selectIcon = (iconUrl: string, option?: FontAwesomeIconOption) => {
    if (option) registerFontAwesomeIconDefinition(option.style, option.definition);
    onChange(iconUrl);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="icon-picker" ref={pickerRef}>
      <button
        className="icon-picker-trigger"
        type="button"
        disabled={disabled}
        aria-label={`${label} icon picker`}
        aria-haspopup="dialog"
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
        <div className="icon-picker-popover" role="dialog" aria-label={`${label} icon picker`}>
          <div className="icon-picker-search-row">
            <input
              ref={searchRef}
              type="search"
              value={search}
              aria-label={`Search ${label} icons`}
              placeholder="Search all free icons…"
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleLimit(INITIAL_ICON_LIMIT);
              }}
            />
            <span aria-live="polite">{visibleIcons.length} icons</span>
          </div>
          <div
            className="icon-picker-options"
            id={gridId}
            role="listbox"
            aria-label={`${label} icons`}
            onScroll={(event) => {
              const element = event.currentTarget;
              if (element.scrollHeight - element.scrollTop - element.clientHeight < 80) {
                setVisibleLimit((current) => Math.min(
                  current + ICON_LIMIT_INCREMENT,
                  visibleIcons.length,
                ));
              }
            }}
          >
            {!normalizedSearch && (
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
            )}
            {renderedIcons.map((option) => {
              const iconUrl = createFontAwesomeIconUrl(option.iconName, option.style);
              const selected = selectedReference?.iconName === option.iconName
                && selectedReference.style === option.style;
              return (
                <button
                  className={selected ? "icon-picker-option selected" : "icon-picker-option"}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-label={`Use ${option.label} icon for ${label}`}
                  title={`${option.label} · ${option.style === "brands" ? "Brands" : "Solid"}`}
                  key={`${option.style}-${option.iconName}`}
                  onClick={() => selectIcon(iconUrl, option)}
                >
                  <FontAwesomeIcon icon={option.definition} aria-hidden="true" />
                </button>
              );
            })}
            {visibleIcons.length === 0 && (
              <p className="icon-picker-empty">
                {iconOptions.length === 0
                  ? "Loading Font Awesome Free icons…"
                  : `No free icons match “${search.trim()}”.`}
              </p>
            )}
            {renderedIcons.length < visibleIcons.length && (
              <p className="icon-picker-more">
                Keep scrolling to browse {visibleIcons.length - renderedIcons.length} more icons.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
