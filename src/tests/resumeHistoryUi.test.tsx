import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("resume history controls", () => {
  it("undoes and redoes editor changes from buttons and keyboard shortcuts", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<App />));
    const createButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());

    const undoButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Undo last change"]',
    );
    const redoButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Redo last change"]',
    );
    const initialSectionCount = container.querySelectorAll("[data-editor-section-id]").length;
    expect(undoButton?.disabled).toBe(true);
    expect(redoButton?.disabled).toBe(true);

    const addSectionButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Add custom section"));
    act(() => addSectionButton?.click());
    expect(container.querySelectorAll("[data-editor-section-id]")).toHaveLength(
      initialSectionCount + 1,
    );
    expect(undoButton?.disabled).toBe(false);

    act(() => undoButton?.click());
    expect(container.querySelectorAll("[data-editor-section-id]")).toHaveLength(
      initialSectionCount,
    );
    expect(redoButton?.disabled).toBe(false);

    act(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true })),
    );
    expect(container.querySelectorAll("[data-editor-section-id]")).toHaveLength(
      initialSectionCount + 1,
    );

    act(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true })),
    );
    expect(container.querySelectorAll("[data-editor-section-id]")).toHaveLength(
      initialSectionCount,
    );

    act(() => root.unmount());
    container.remove();
  });
});
