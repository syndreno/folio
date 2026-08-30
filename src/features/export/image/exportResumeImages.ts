import { toJpeg, toPng } from "html-to-image";
import JSZip from "jszip";
import { downloadBlob } from "../../../utils/files";

export type ResumeImageFormat = "png" | "jpeg";

const EDITOR_ONLY_PREVIEW_CLASSES = [
  "preview-drag-handle",
  "preview-entry-drag-handle",
];

export function shouldIncludeResumeImageNode(node: Node): boolean {
  // html-to-image also visits SVG and text nodes, which do not always expose
  // HTMLElement.classList. Only editor-owned HTML controls need filtering.
  if (!(node instanceof HTMLElement)) return true;
  return !EDITOR_ONLY_PREVIEW_CLASSES.some((className) => node.classList.contains(className));
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function findRenderedResumePages(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(".preview-scroll .resume-page:not(.resume-measurement)"),
  );
}

export async function exportResumeImages(
  baseFileName: string,
  format: ResumeImageFormat,
): Promise<number> {
  const pages = findRenderedResumePages();
  if (pages.length === 0) throw new Error("No rendered resume pages are available.");

  const renderedPages: Array<{ dataUrl: string; fileName: string }> = [];

  for (const [index, page] of pages.entries()) {
    const options = {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: getComputedStyle(page).backgroundColor || "#FFFFFF",
      // Drag handles belong to the editor UI, not to the exported resume.
      filter: shouldIncludeResumeImageNode,
    };
    const dataUrl = format === "png"
      ? await toPng(page, options)
      : await toJpeg(page, { ...options, quality: 0.94 });
    const extension = format === "jpeg" ? "jpg" : "png";
    renderedPages.push({ dataUrl, fileName: `${baseFileName}-page-${index + 1}.${extension}` });
  }

  if (renderedPages.length === 1) {
    const renderedPage = renderedPages[0];
    if (renderedPage) downloadDataUrl(renderedPage.dataUrl, renderedPage.fileName);
  } else {
    const archive = new JSZip();
    renderedPages.forEach(({ dataUrl, fileName }) => {
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      archive.file(fileName, base64, { base64: true });
    });
    downloadBlob(
      await archive.generateAsync({ type: "blob", compression: "DEFLATE" }),
      `${baseFileName}-${format === "jpeg" ? "jpg" : "png"}-pages.zip`,
    );
  }
  return pages.length;
}
