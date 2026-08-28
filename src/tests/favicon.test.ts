import { beforeEach, describe, expect, it } from "vitest";
import {
  createFolioFaviconDataUrl,
  updateFolioBrowserBranding,
} from "../utils/favicon";

beforeEach(() => {
  document.head.innerHTML = "";
});

describe("Folio browser branding", () => {
  it("uses the website color in the logo favicon", () => {
    const dataUrl = createFolioFaviconDataUrl("#D96C5F");
    const svg = decodeURIComponent(dataUrl.split(",")[1] ?? "");

    expect(dataUrl.startsWith("data:image/svg+xml,")).toBe(true);
    expect(svg).toContain('fill="#D96C5F"');
    expect(svg).toContain(">F</text>");
  });

  it("updates one favicon and the browser theme color", () => {
    updateFolioBrowserBranding("#176B55");
    updateFolioBrowserBranding("#6C4AB6");

    const favicon = document.querySelector<HTMLLinkElement>("#folio-favicon");
    const svg = decodeURIComponent(favicon?.href.split(",")[1] ?? "");
    expect(document.querySelectorAll("#folio-favicon")).toHaveLength(1);
    expect(svg).toContain('fill="#6C4AB6"');
    expect(document.querySelector<HTMLMetaElement>("#folio-theme-color")?.content).toBe("#6C4AB6");
  });
});
