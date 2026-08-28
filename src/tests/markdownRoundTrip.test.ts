import { describe, expect, it } from "vitest";
import { parseResumeMarkdown } from "../parsers/markdown/parseResumeMarkdown";
import { serializeResumeMarkdown } from "../serializers/markdown/serializeResumeMarkdown";

const FIXTURE = `---
resume_version: 1
name: "Priya Rao"
title: "Product Designer"
email: "priya@example.com"
accent_color: "#176B55"
paper_color: "#FFFFFF"
text_color: "#1F2933"
font_family: "Georgia"
font_size: 11
line_height: 1.3
page_size: "A4"
hidden_sections:
  - languages
---

# Profile

Designer focused on accessible digital products.

# Professional Experience

## Senior Product Designer — Example Studio

**January 2022 - Present | Bengaluru, India**

- Improved task completion by 30% through usability testing.
- Created a shared design system.

# Languages

- English
- Hindi

# Custom: Speaking

- Design Systems Conference — 2025
`;

describe("Markdown resume compatibility", () => {
  it("detects aliases and preserves unknown sections", () => {
    const result = parseResumeMarkdown(FIXTURE, "priya-resume.md");

    expect(result.resume.personal.fullName).toBe("Priya Rao");
    expect(result.resume.sections.map((section) => section.type)).toEqual([
      "summary",
      "experience",
      "languages",
      "custom",
    ]);
    expect(result.resume.sections[2]?.visible).toBe(false);
    expect(result.resume.sections[3]?.title).toBe("Speaking");
    expect(result.warnings).toContain("“Speaking” was imported as a custom section.");
  });

  it("preserves content, order, visibility, and design settings through a round trip", () => {
    const first = parseResumeMarkdown(FIXTURE).resume;
    first.design.contactIconUrls.email =
      "https://fontawesome.com/icons/map-pin?f=classic&s=solid";
    first.design.contactIconUrls.github = "";
    const exported = serializeResumeMarkdown(first);
    const second = parseResumeMarkdown(exported).resume;

    expect(second.personal).toEqual(first.personal);
    expect(second.design).toEqual(first.design);
    expect(exported).toContain("https://fontawesome.com/icons/map-pin");
    expect(second.design.contactIconUrls.github).toBe("");
    expect(second.sections.map(({ type, title, visible, content }) => ({ type, title, visible, content }))).toEqual(
      first.sections.map(({ type, title, visible, content }) => ({ type, title, visible, content })),
    );
    expect(second.sections[1]?.items[0]?.bullets).toEqual(first.sections[1]?.items[0]?.bullets);
  });

  it("ignores instruction comments and raw HTML", () => {
    const result = parseResumeMarkdown(`# Summary\n\n<!-- helper text --><script>alert(1)</script>Safe text`);

    expect(result.resume.sections[0]?.content).toBe("alert(1)Safe text");
    expect(result.resume.sections[0]?.content).not.toContain("script");
    expect(result.resume.sections[0]?.content).not.toContain("helper text");
  });

  it("continues with defaults when front matter is malformed", () => {
    const result = parseResumeMarkdown(`---\nname: [broken\n---\n\n# Skills\n\n- TypeScript`);

    expect(result.resume.personal.fullName).toBe("Your Name");
    expect(result.resume.sections[0]?.items[0]?.title).toBe("TypeScript");
    expect(result.warnings.some((warning) => warning.includes("YAML"))).toBe(true);
  });

  it("accepts supported Font Awesome URLs and rejects arbitrary icon sources", () => {
    const result = parseResumeMarkdown(`---
resume_version: 1
show_contact_icons: true
contact_icons:
  email: "https://fontawesome.com/icons/at?f=classic&s=solid"
  phone: "https://untrusted.example/icon.svg"
---

# Skills

- TypeScript`);

    expect(result.resume.design.showContactIcons).toBe(true);
    expect(result.resume.design.contactIconUrls.email).toContain("fontawesome.com/icons/at");
    expect(result.resume.design.contactIconUrls.phone).toBe("");
    expect(result.warnings).toContain(
      "The phone icon URL is not a supported Font Awesome Free icon and was not loaded.",
    );
  });

  it("restores custom link titles, URLs, and icon selections", () => {
    const first = parseResumeMarkdown(FIXTURE).resume;
    first.personal.customLinks = [{
      id: "link-portfolio",
      title: "Portfolio",
      url: "https://portfolio.example.com",
      iconUrl: "https://fontawesome.com/icons/link?f=classic&s=solid",
    }];

    const exported = serializeResumeMarkdown(first);
    const second = parseResumeMarkdown(exported).resume;
    const restored = second.personal.customLinks[0];

    expect(exported).toContain("custom_links:");
    expect(exported).toContain("title: Portfolio");
    expect(restored).toMatchObject({
      title: "Portfolio",
      url: "https://portfolio.example.com",
      iconUrl: "https://fontawesome.com/icons/link?f=classic&s=solid",
    });
    expect(restored?.id).not.toBe("link-portfolio");
  });

  it("does not activate unsafe custom link destinations or icon sources", () => {
    const result = parseResumeMarkdown(`---
custom_links:
  - header: "Portfolio"
    content: "View work"
    url: "javascript:alert(1)"
    icon: "https://untrusted.example/icon.svg"
---

# Skills

- TypeScript`);

    expect(result.resume.personal.customLinks[0]).toMatchObject({
      title: "View work",
      url: "javascript:alert(1)",
      iconUrl: "",
    });
    expect(result.warnings.some((warning) => warning.includes("not a safe HTTP or HTTPS URL"))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("not a supported Font Awesome Free icon"))).toBe(true);
  });
});
