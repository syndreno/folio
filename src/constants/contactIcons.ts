import type { ContactIconKey, ContactIconUrls } from "../domain/resume.types";

export const CONTACT_ICON_KEYS = [
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
] as const satisfies readonly ContactIconKey[];

export const SUPPORTED_FONT_AWESOME_ICON_NAMES = [
  "at",
  "briefcase",
  "envelope",
  "github",
  "globe",
  "link",
  "linkedin",
  "location-dot",
  "map-pin",
  "mobile-screen-button",
  "phone",
  "user",
] as const;

export type SupportedFontAwesomeIconName = (typeof SUPPORTED_FONT_AWESOME_ICON_NAMES)[number];

const BRAND_ICON_NAMES = new Set<SupportedFontAwesomeIconName>(["github", "linkedin"]);

export const DEFAULT_CONTACT_ICON_URLS: ContactIconUrls = {
  email: "https://fontawesome.com/icons/envelope?f=classic&s=solid",
  phone: "https://fontawesome.com/icons/phone?f=classic&s=solid",
  location: "https://fontawesome.com/icons/location-dot?f=classic&s=solid",
  website: "https://fontawesome.com/icons/globe?f=classic&s=solid",
  linkedin: "https://fontawesome.com/icons/linkedin?f=brands&s=brands",
  github: "https://fontawesome.com/icons/github?f=brands&s=brands",
};

export function getFontAwesomeIconName(urlValue: string): SupportedFontAwesomeIconName | null {
  try {
    const url = new URL(urlValue);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "fontawesome.com" && url.hostname !== "www.fontawesome.com") return null;
    const pathMatch = url.pathname.match(/^\/icons\/([a-z0-9-]+)\/?$/i);
    const iconName = pathMatch?.[1]?.toLocaleLowerCase("en");
    if (!iconName) return null;
    return SUPPORTED_FONT_AWESOME_ICON_NAMES.find((supported) => supported === iconName) ?? null;
  } catch {
    return null;
  }
}

export function createFontAwesomeIconUrl(iconName: SupportedFontAwesomeIconName): string {
  return BRAND_ICON_NAMES.has(iconName)
    ? `https://fontawesome.com/icons/${iconName}?f=brands&s=brands`
    : `https://fontawesome.com/icons/${iconName}?f=classic&s=solid`;
}

export function formatFontAwesomeIconName(iconName: SupportedFontAwesomeIconName): string {
  return iconName
    .split("-")
    .map((word) => word.charAt(0).toLocaleUpperCase("en") + word.slice(1))
    .join(" ");
}
