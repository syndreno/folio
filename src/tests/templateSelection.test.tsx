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
  it("registers 58 configurations across nineteen layout families and three tiers", () => {
    expect(TEMPLATE_DEFINITIONS).toHaveLength(58);
    expect(TEMPLATE_DEFINITIONS.filter((template) => template.category === "basic")).toHaveLength(18);
    expect(TEMPLATE_DEFINITIONS.filter((template) => template.category === "advanced")).toHaveLength(18);
    expect(TEMPLATE_DEFINITIONS.filter((template) => template.category === "premium")).toHaveLength(22);
    expect(new Set(TEMPLATE_DEFINITIONS.map((template) => template.id))).toHaveLength(58);
    expect(new Set(TEMPLATE_DEFINITIONS.map((template) => template.layoutFamily))).toHaveLength(19);
    expect(TEMPLATE_REGISTRY.modern).toMatchObject({
      atsRating: "optimized",
      supportsTwoColumns: false,
      supportsPhoto: false,
    });
    expect(new Set(TEMPLATE_DEFINITIONS.map((template) => template.visualPreset.accentColor)).size)
      .toBeGreaterThanOrEqual(9);
    expect(TEMPLATE_REGISTRY.veridian).toMatchObject({ layout: "sidebar", supportsTwoColumns: true });
    expect(TEMPLATE_REGISTRY.boardroom).toMatchObject({ layout: "statement", audience: "executive" });
    expect(TEMPLATE_REGISTRY.aperture).toMatchObject({ layout: "showcase", atsRating: "creative" });
    expect(TEMPLATE_REGISTRY.maison).toMatchObject({ layout: "monogram", supportsPhoto: true });
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

  it("quick-switches templates inside the Design panel without opening the catalog", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<TemplateHarness />));
    const quickSwitcher = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent === "Quick switch template");
    act(() => quickSwitcher?.click());

    const search = container.querySelector<HTMLInputElement>('input[aria-label="Search quick templates"]');
    if (!search) throw new Error("Quick template search is missing");

    const engineerTemplate = Array.from(container.querySelectorAll<HTMLButtonElement>(".quick-template-card"))
      .find((button) => button.querySelector(":scope > span > strong")?.textContent === "Engineer");
    expect(engineerTemplate).toBeDefined();
    await act(async () => engineerTemplate?.click());

    expect(container.querySelector(".template-engineer")?.textContent).toContain("Preserved Candidate");
    expect(container.querySelector(".selected-template-card")?.textContent).toContain("Engineer");
    expect(container.querySelector(".template-catalog-grid")).toBeNull();

    act(() => root.unmount());
    container.remove();
  });
});
