const DEFAULT_BRAND_COLOR = "#245B4E";

function supportedBrandColor(value: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value.toUpperCase() : DEFAULT_BRAND_COLOR;
}

export function createFolioFaviconDataUrl(accentColor: string): string {
  const color = supportedBrandColor(accentColor);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="${color}"/><text x="31" y="45" fill="#FFFFFF" font-family="Georgia,Times New Roman,serif" font-size="40" font-style="italic" font-weight="700" text-anchor="middle">F</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function updateFolioBrowserBranding(accentColor: string): void {
  if (typeof document === "undefined") return;
  const color = supportedBrandColor(accentColor);

  let favicon = document.querySelector<HTMLLinkElement>("#folio-favicon");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.id = "folio-favicon";
    favicon.rel = "icon";
    document.head.append(favicon);
  }
  favicon.type = "image/svg+xml";
  favicon.href = createFolioFaviconDataUrl(color);

  let themeColor = document.querySelector<HTMLMetaElement>("#folio-theme-color");
  if (!themeColor) {
    themeColor = document.createElement("meta");
    themeColor.id = "folio-theme-color";
    themeColor.name = "theme-color";
    document.head.append(themeColor);
  }
  themeColor.content = color;
}
