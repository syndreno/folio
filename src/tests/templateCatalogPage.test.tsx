import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { TemplateCatalogPage } from "../features/templates/TemplateCatalogPage";

describe("template catalog page", () => {
  it("filters templates by career type and starts with the chosen layout", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const onUseTemplate = vi.fn();

    await act(async () => root.render(
      <TemplateCatalogPage
        selectedTemplateId="classic"
        hasOpenResume={false}
        onBack={() => undefined}
        onHome={() => undefined}
        onUseTemplate={onUseTemplate}
      />,
    ));

    expect(container.querySelector(".template-catalog-grid")).not.toBeNull();
    expect(container.textContent).toContain("58 templates");
    expect(container.querySelector(".template-miniature")?.textContent).toContain("Maya Chen");
    expect(container.querySelector(".template-miniature")?.textContent).toContain("Experience");
    expect(container.querySelector(".template-miniature")?.textContent).toContain("Education");

    const careerFilter = Array.from(container.querySelectorAll("label"))
      .find((label) => label.textContent?.includes("Career type"))
      ?.querySelector("select");
    if (!careerFilter) throw new Error("Career type filter is missing");
    act(() => {
      careerFilter.value = "technology";
      careerFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.textContent).toContain("5 templates");
    expect(container.textContent).toContain("Engineer");
    expect(container.textContent).not.toContain("Hospitality");

    const useEngineer = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent === "Use Engineer");
    act(() => useEngineer?.click());
    expect(onUseTemplate).toHaveBeenCalledWith("engineer");

    act(() => root.unmount());
    container.remove();
  });
});
