export const MAX_MARKDOWN_FILE_BYTES = 5 * 1024 * 1024;

export function sanitizeFileName(value: string): string {
  const safeName = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return safeName || "resume";
}

export function downloadTextFile(contents: string, fileName: string) {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, fileName);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function isAcceptedMarkdownFile(file: File): string | null {
  if (!file.name.toLocaleLowerCase("en").endsWith(".md")) {
    return "Choose a Markdown file with a .md extension.";
  }
  if (file.size > MAX_MARKDOWN_FILE_BYTES) {
    return "The Markdown file is larger than the supported 5 MB limit.";
  }
  return null;
}
