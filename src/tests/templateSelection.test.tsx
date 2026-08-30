import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { createBlankResume } from "../domain/resume.defaults";
import type { ResumeDocument } from "../domain/resume.types";
import { DesignPanel } from "../features/design/DesignPanel";
import { ClassicTemplate } from "../features/templates/classic/ClassicTemplate";
import { TEMPLATE_DEFINITIONS, TEMPLATE_REGISTRY } from "../features/templates/registry";
import { TemplateCatalogPage } from "../features/templates/TemplateCatalogPage";

function TemplateHarness() {
  const [showCatalog, setShowCatalog] = useState(false);
  const [resume, setResume] = useState<ResumeDocument>(() => {
    const initial = createBlankResume();
    return {
      ...initial,
      personal: { ...initial.personal, fullName: "Preserved Candidate" },
    };
  });

  if (showCatalog) {
    return (
      <TemplateCatalogPage
        selectedTemplateId={resume.design.templateId}
        hasOpenResume
        onBack={() => setShowCatalog(false)}
        onHome={() => undefined}
        onUseTemplate={(templateId) => {
          setResume((current) => ({
            ...current,
            design: { ...current.design, templateId },
          }));
          setShowCatalog(false);
        }}
      />
    );
  }

  return (
    <>
      <DesignPanel
        design={resume.design}
        photo={resume.personal.photo}
        onBrowseTemplates={() => setShowCatalog(true)}
        onPhotoChange={(photo) =>
          setResume((current) => ({
            ...current,
            personal: { ...current.personal, photo },
          }))
        }
        onDesignChange={(patch) =>
          setResume((current) => ({
            ...current,
            design: { ...current.design, ...patch },
          }))
        }
      />
      <ClassicTemplate resume={resume} />
    </>
  );
}

describe("template selection", () => {
  it("registers 54 configurations across fifteen layout families and three tiers", () => {
    expect(TEMPLATE_DEFINITIONS).toHaveLength(54);
    expect(TEMPLATE_DEFINITIONS.filter((template) => template.category === "basic")).toHaveLength(18);
    expect(TEMPLATE_DEFINITIONS.filter((template) => template.category === "advanced")).toHaveLength(18);
    expect(TEMPLATE_DEFINITIONS.filter((template) => template.category === "premium")).toHaveLength(18);
    expect(new Set(TEMPLATE_DEFINITIONS.map((template) => template.id))).toHaveLength(54);
    expect(new Set(TEMPLATE_DEFINITIONS.map((template) => template.layoutFamily))).toHaveLength(15);
    expect(TEMPLATE_REGISTRY.modern).toMatchObject({
      atsRating: "optimized",
      supportsTwoColumns: false,
      supportsPhoto: false,
    });
  });

  it("switches presentation without changing resume content", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<TemplateHarness />));
    expect(container.querySelector(".template-classic")?.textContent).toContain(
      "Preserved Candidate",
    );

    const browseTemplates = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Browse all"));
    act(() => browseTemplates?.click());

    const modernTemplate = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Use Modern ATS"));
    act(() => modernTemplate?.click());

    expect(container.querySelector(".template-modern")?.textContent).toContain(
      "Preserved Candidate",
    );
    expect(container.querySelector(".selected-template-card")?.textContent).toContain("Modern ATS");

    act(() => root.unmount());
    container.remove();
  });
});
