import { describe, expect, it } from "vitest";
import { createBlankResume } from "../domain/resume.defaults";
import { analyzeAtsReadiness } from "../features/ats/analyzeAtsReadiness";

describe("ATS Readiness", () => {
  it("reports actionable warnings for an incomplete resume", () => {
    const resume = createBlankResume();
    resume.personal.email = "not-an-email";
    resume.personal.phone = "";
    resume.personal.location = "";
    resume.design.fontSize = 9;

    const analysis = analyzeAtsReadiness(resume);

    expect(analysis.score).toBeLessThan(80);
    expect(analysis.findings.find((finding) => finding.id === "contact.email")?.status).toBe("warning");
    expect(analysis.findings.find((finding) => finding.id === "design.font-size")?.status).toBe("warning");
  });

  it("improves when contact details and measurable achievements are present", () => {
    const resume = createBlankResume();
    resume.personal.fullName = "Priya Rao";
    resume.personal.email = "priya@example.com";
    resume.personal.phone = "+91 98765 43210";
    resume.personal.location = "Pune, India";
    const experience = resume.sections.find((section) => section.type === "experience");
    if (!experience) throw new Error("Experience fixture is missing");
    experience.items[0] = {
      ...experience.items[0]!,
      title: "Senior Engineer",
      bullets: ["Reduced processing time by 35% for more than 20,000 monthly requests."],
    };

    experience.items[0]!.meta = "January 2023 - Present | Pune, India";
    const skills = resume.sections.find((section) => section.type === "skills");
    if (!skills) throw new Error("Skills fixture is missing");
    skills.items = ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"].map((title, index) => ({
      ...skills.items[0]!,
      id: `skill-${index}`,
      title,
    }));

    const analysis = analyzeAtsReadiness(resume);

    expect(analysis.score).toBeGreaterThan(60);
    expect(analysis.findings.find((finding) => finding.id === "content.measurable-achievements")?.status).toBe("pass");
    expect(analysis.findings.find((finding) => finding.id === "export.selectable-text")?.status).toBe("pass");
  });

  it("covers every ATS rule category and detects content risks", () => {
    const resume = createBlankResume();
    resume.personal.fullName = "Candidate 😀";
    resume.personal.professionalTitle = "Engineer";
    const experience = resume.sections.find((section) => section.type === "experience");
    if (!experience) throw new Error("Experience fixture is missing");
    experience.items[0] = {
      ...experience.items[0]!,
      title: "Engineer",
      meta: "01/2024 - 02/2025",
      description: "platform ".repeat(60),
      bullets: ["I built platform platform platform platform platform platform platform platform."],
    };

    const analysis = analyzeAtsReadiness(resume);
    const categories = new Set(analysis.findings.map((finding) => finding.category));

    expect(analysis.findings).toHaveLength(34);
    expect(categories).toEqual(new Set(["Contact", "Sections", "Content", "Dates", "Design", "Export"]));
    expect(analysis.findings.find((finding) => finding.id === "content.repetition")?.status).toBe("warning");
    expect(analysis.findings.find((finding) => finding.id === "content.first-person")?.status).toBe("warning");
    expect(analysis.findings.find((finding) => finding.id === "dates.conventional")?.status).toBe("warning");
    expect(analysis.findings.find((finding) => finding.id === "design.supported-symbols")?.status).toBe("warning");
  });
});
