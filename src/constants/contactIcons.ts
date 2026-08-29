import type { ContactIconKey, ContactIconUrls } from "../domain/resume.types";

export const CONTACT_ICON_KEYS = [
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
] as const satisfies readonly ContactIconKey[];

export type FontAwesomeIconStyle = "solid" | "brands";

export interface FontAwesomeIconReference {
  iconName: string;
  style: FontAwesomeIconStyle;
}

const DEFAULT_BRAND_ICON_NAMES = new Set(["github", "linkedin"]);

export const DEFAULT_CONTACT_ICON_URLS: ContactIconUrls = {
  email: "https://fontawesome.com/icons/envelope?f=classic&s=solid",
  phone: "https://fontawesome.com/icons/phone?f=classic&s=solid",
  location: "https://fontawesome.com/icons/location-dot?f=classic&s=solid",
  website: "https://fontawesome.com/icons/globe?f=classic&s=solid",
  linkedin: "https://fontawesome.com/icons/linkedin?f=brands&s=brands",
  github: "https://fontawesome.com/icons/github?f=brands&s=brands",
};

export function getFontAwesomeIconReference(urlValue: string): FontAwesomeIconReference | null {
  try {
    const url = new URL(urlValue);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "fontawesome.com" && url.hostname !== "www.fontawesome.com") return null;
    const pathMatch = url.pathname.match(/^\/icons\/([a-z0-9-]+)\/?$/i);
    const iconName = pathMatch?.[1]?.toLocaleLowerCase("en");
    if (!iconName) return null;
    const style = url.searchParams.get("f") === "brands" || url.searchParams.get("s") === "brands"
      ? "brands"
      : "solid";
    return { iconName, style };
  } catch {
    return null;
  }
}

export function getFontAwesomeIconName(urlValue: string): string | null {
  return getFontAwesomeIconReference(urlValue)?.iconName ?? null;
}

export function createFontAwesomeIconUrl(
  iconName: string,
  requestedStyle?: FontAwesomeIconStyle,
): string {
  const style = requestedStyle
    ?? (DEFAULT_BRAND_ICON_NAMES.has(iconName) ? "brands" : "solid");
  return style === "brands"
    ? `https://fontawesome.com/icons/${iconName}?f=brands&s=brands`
    : `https://fontawesome.com/icons/${iconName}?f=classic&s=solid`;
}

export function formatFontAwesomeIconName(iconName: string): string {
  if (iconName === "github") return "GitHub";
  if (iconName === "linkedin") return "LinkedIn";
  return iconName
    .split("-")
    .map((word) => word.charAt(0).toLocaleUpperCase("en") + word.slice(1))
    .join(" ");
}
