import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { createBlankResume } from "../domain/resume.defaults";
import type { ResumeDocument } from "../domain/resume.types";
import { DesignPanel } from "../features/design/DesignPanel";
import { ClassicTemplate } from "../features/templates/classic/ClassicTemplate";
import { TEMPLATE_DEFINITIONS, TEMPLATE_REGISTRY } from "../features/templates/registry";

function TemplateHarness() {
  const [resume, setResume] = useState<ResumeDocument>(() => {
    const initial = createBlankResume();
    return {
      ...initial,
      personal: { ...initial.personal, fullName: "Preserved Candidate" },
    };
  });

  return (
    <>
      <DesignPanel
        design={resume.design}
        photo={resume.personal.photo}
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
  it("registers both templates as ATS-optimized single-column layouts", () => {
    expect(TEMPLATE_DEFINITIONS.map((template) => template.id)).toEqual([
      "classic",
      "modern",
      "professional",
    ]);
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

    const modernTemplate = container.querySelector<HTMLButtonElement>(
      'button[role="radio"][aria-checked="false"]',
    );
    act(() => modernTemplate?.click());

    expect(container.querySelector(".template-modern")?.textContent).toContain(
      "Preserved Candidate",
    );
    expect(
      container.querySelector('button[role="radio"][aria-checked="true"]')?.textContent,
    ).toContain("Modern ATS");

    act(() => root.unmount());
    container.remove();
  });
});
