import type { IconDefinition, IconPack } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import {
  formatFontAwesomeIconName,
  getFontAwesomeIconReference,
  type FontAwesomeIconStyle,
} from "../../constants/contactIcons";

export interface FontAwesomeIconOption {
  definition: IconDefinition;
  iconName: string;
  label: string;
  searchText: string;
  style: FontAwesomeIconStyle;
}

function createIconOptions(
  pack: IconPack,
  style: FontAwesomeIconStyle,
): FontAwesomeIconOption[] {
  const uniqueIcons = new Map<string, FontAwesomeIconOption>();

  Object.entries(pack).forEach(([exportName, definition]) => {
    const existing = uniqueIcons.get(definition.iconName);
    const alias = exportName.replace(/^fa/, "").replaceAll(/([a-z])([A-Z])/g, "$1 $2");
    if (existing) {
      existing.searchText += ` ${alias.toLocaleLowerCase("en")}`;
      return;
    }

    const label = formatFontAwesomeIconName(definition.iconName);
    const ligatures = definition.icon[2].filter(
      (value): value is string => typeof value === "string",
    );
    uniqueIcons.set(definition.iconName, {
      definition,
      iconName: definition.iconName,
      label,
      searchText: `${label} ${definition.iconName} ${alias} ${ligatures.join(" ")} ${style}`
        .toLocaleLowerCase("en"),
      style,
    });
  });

  return [...uniqueIcons.values()];
}

export const FONT_AWESOME_ICON_OPTIONS = [
  ...createIconOptions(fas, "solid"),
  ...createIconOptions(fab, "brands"),
].sort((first, second) => first.label.localeCompare(second.label));

const CATALOG_REGISTRY = new Map(
  FONT_AWESOME_ICON_OPTIONS.map((option) => [
    `${option.style}:${option.iconName}`,
    option.definition,
  ]),
);

export function getFontAwesomeCatalogDefinition(urlValue: string): IconDefinition | undefined {
  const reference = getFontAwesomeIconReference(urlValue);
  if (!reference) return undefined;
  return CATALOG_REGISTRY.get(`${reference.style}:${reference.iconName}`)
    ?? FONT_AWESOME_ICON_OPTIONS.find((option) => option.iconName === reference.iconName)?.definition;
}
