import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("section copy action", () => {
  it("adds independent copies immediately after the selected section", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<App />));
    const createButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());

    act(() => container.querySelector<HTMLButtonElement>('button[aria-label="Copy Experience"]')?.click());
    act(() => container.querySelector<HTMLButtonElement>('button[aria-label="Copy Experience Copy"]')?.click());

    const sectionTitles = Array.from(
      container.querySelectorAll<HTMLInputElement>("[data-editor-section-id] .section-toolbar input"),
      (input) => input.value,
    );
    expect(sectionTitles.slice(1, 4)).toEqual([
      "Experience",
      "Experience Copy",
      "Experience Copy 2",
    ]);

    act(() => root.unmount());
    container.remove();
  });
});
