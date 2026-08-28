import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createBlankResume } from "../domain/resume.defaults";
import { ClassicTemplate } from "../features/templates/classic/ClassicTemplate";

describe("contact icons", () => {
  it("renders a bundled icon while preserving the contact value as text", () => {
    const resume = createBlankResume();
    resume.personal.email = "candidate@example.com";
    const markup = renderToStaticMarkup(<ClassicTemplate resume={resume} />);

    expect(markup).toContain("<svg");
    expect(markup).toContain("candidate@example.com");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('class="resume-contact with-icons"');
  });

  it("retains text when contact icons are disabled", () => {
    const resume = createBlankResume();
    resume.personal.email = "candidate@example.com";
    resume.design.showContactIcons = false;
    const markup = renderToStaticMarkup(<ClassicTemplate resume={resume} />);

    expect(markup).not.toContain("<svg");
    expect(markup).toContain("candidate@example.com");
    expect(markup).toContain('class="resume-contact without-icons"');
  });

  it("renders a custom link with its label, content, destination, and selected icon", () => {
    const resume = createBlankResume();
    resume.personal.customLinks = [{
      id: "portfolio-link",
      title: "Portfolio",
      url: "https://portfolio.example.com",
      iconUrl: "https://fontawesome.com/icons/link?f=classic&s=solid",
    }];

    const markup = renderToStaticMarkup(<ClassicTemplate resume={resume} />);

    expect(markup).toContain(">Portfolio<");
    expect(markup).toContain('href="https://portfolio.example.com/"');
    expect(markup).toContain("fa-link");
  });
});
