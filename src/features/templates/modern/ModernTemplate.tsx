import { ClassicTemplate } from "../classic/ClassicTemplate";
import type { ResumeTemplateProps } from "../template.types";

// Modern ATS shares the proven single-column pagination and drag behavior,
// while its template-scoped CSS controls the presentation.
export function ModernTemplate(props: ResumeTemplateProps) {
  return <ClassicTemplate {...props} />;
}
