import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("export dialog", () => {
  it("offers every supported export format with ATS guidance", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(<App />));
    const createButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());
    const exportButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.trim() === "Export");
    act(() => exportButton?.click());

    const dialogText = container.querySelector<HTMLElement>('[role="dialog"]')?.textContent;
    expect(dialogText).toContain("ATS PDF");
    expect(dialogText).toContain("Word DOCX");
    expect(dialogText).toContain("PNG pages");
    expect(dialogText).toContain("JPEG pages");
    expect(dialogText).toContain("Markdown");
    expect(dialogText).toContain("For job applications and ATS systems");

    act(() => root.unmount());
    container.remove();
  });
});
