import { pdf } from "@react-pdf/renderer";
import type { ResumeDocument } from "../../../domain/resume.types";
import { ResumePdfDocument } from "./ResumePdfDocument";

export async function buildResumePdfBlob(resume: ResumeDocument): Promise<Blob> {
  return pdf(<ResumePdfDocument resume={resume} />).toBlob();
}

export async function exportResumeToPdf(resume: ResumeDocument, fileName: string): Promise<void> {
  const blob = await buildResumePdfBlob(resume);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
