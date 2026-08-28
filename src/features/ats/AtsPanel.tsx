import type { ResumeDocument } from "../../domain/resume.types";
import { analyzeAtsReadiness, type AtsCategory } from "./analyzeAtsReadiness";

const ATS_CATEGORIES: AtsCategory[] = ["Contact", "Sections", "Content", "Dates", "Design", "Export"];

export function AtsPanel({ resume }: { resume: ResumeDocument }) {
  const analysis = analyzeAtsReadiness(resume);

  return (
    <div className="editor-stack">
      <section className="editor-card ats-overview">
        <p className="eyebrow">Live analysis</p>
        <div className="ats-score-row">
          <div className="score-ring" style={{ "--ats-score": `${analysis.score * 3.6}deg` } as React.CSSProperties}>
            <strong>{analysis.score}</strong>
            <span>out of 100</span>
          </div>
          <div>
            <h2>ATS Readiness</h2>
            <p className="supporting-copy">
              {analysis.passed} checks passed · {analysis.warnings} suggestions · approximately {analysis.estimatedPages} {analysis.estimatedPages === 1 ? "page" : "pages"}
            </p>
            <p className="ats-disclaimer">
              This is practical formatting and content guidance, not a guarantee of employer or ATS outcomes.
            </p>
          </div>
        </div>
      </section>

      <section className="editor-card">
        <h2>Complete ATS checks</h2>
        {ATS_CATEGORIES.map((category) => {
          const findings = analysis.findings.filter((finding) => finding.category === category);
          const warnings = findings.filter((finding) => finding.status === "warning").length;
          return (
            <section className="ats-category" key={category}>
              <div className="ats-category-heading">
                <h3>{category}</h3>
                <span>{warnings === 0 ? "All passed" : `${warnings} ${warnings === 1 ? "suggestion" : "suggestions"}`}</span>
              </div>
              <div className="ats-findings">
                {findings.map((finding) => (
                  <article className={`ats-finding ${finding.status}`} key={finding.id}>
                    <span className="finding-icon" aria-hidden="true">
                      {finding.status === "pass" ? "✓" : "!"}
                    </span>
                    <div>
                      <h4>{finding.title}</h4>
                      <p>{finding.detail}</p>
                    </div>
                    <span className="sr-only">{finding.status === "pass" ? "Passed" : "Suggestion"}</span>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
