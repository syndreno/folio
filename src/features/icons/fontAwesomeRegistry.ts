import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import {
  faAt,
  faBriefcase,
  faEnvelope,
  faGlobe,
  faLink,
  faLocationDot,
  faMapPin,
  faMobileScreenButton,
  faPhone,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import {
  getFontAwesomeIconReference,
} from "../../constants/contactIcons";

const ICON_REGISTRY = new Map<string, IconDefinition>([
  ["solid:at", faAt],
  ["solid:briefcase", faBriefcase],
  ["solid:envelope", faEnvelope],
  ["brands:github", faGithub],
  ["solid:globe", faGlobe],
  ["solid:link", faLink],
  ["brands:linkedin", faLinkedin],
  ["solid:location-dot", faLocationDot],
  ["solid:map-pin", faMapPin],
  ["solid:mobile-screen-button", faMobileScreenButton],
  ["solid:phone", faPhone],
  ["solid:user", faUser],
]);

export function getFontAwesomeIconDefinition(urlValue: string): IconDefinition | undefined {
  const reference = getFontAwesomeIconReference(urlValue);
  if (!reference) return undefined;
  return ICON_REGISTRY.get(`${reference.style}:${reference.iconName}`);
}

export function registerFontAwesomeIconDefinition(
  style: "solid" | "brands",
  definition: IconDefinition,
): void {
  ICON_REGISTRY.set(`${style}:${definition.iconName}`, definition);
}

export async function loadFontAwesomeIconDefinition(
  urlValue: string,
): Promise<IconDefinition | undefined> {
  const availableIcon = getFontAwesomeIconDefinition(urlValue);
  if (availableIcon) return availableIcon;
  const reference = getFontAwesomeIconReference(urlValue);
  if (!reference) return undefined;
  const { getFontAwesomeCatalogDefinition } = await import("./fontAwesomeCatalog");
  const definition = getFontAwesomeCatalogDefinition(urlValue);
  if (definition) registerFontAwesomeIconDefinition(reference.style, definition);
  return definition;
}
