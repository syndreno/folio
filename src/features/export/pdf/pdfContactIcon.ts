import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface PdfContactIconData {
  paths: string[];
  viewBox: string;
}

/**
 * Converts a bundled Font Awesome definition into data that React PDF can
 * paint as vector paths. No network request is made during export.
 */
export function createPdfContactIconData(
  icon: IconDefinition | undefined,
): PdfContactIconData | undefined {
  if (!icon) return undefined;
  const [width, height, , , svgPathData] = icon.icon;
  const paths = Array.isArray(svgPathData) ? svgPathData : [svgPathData];
  if (paths.length === 0 || paths.some((path) => !path)) return undefined;

  return {
    paths,
    viewBox: `0 0 ${width} ${height}`,
  };
}
