import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("accessible entry reordering", () => {
  it("provides move controls as an alternative to preview drag and drop", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(<App />));
    const createButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());

    const experienceCard = Array.from(
      container.querySelectorAll<HTMLElement>("[data-editor-section-id]"),
    ).find((card) => card.querySelector<HTMLInputElement>(".grow-field input")?.value === "Experience");
    const addEntryButton = Array.from(experienceCard?.querySelectorAll("button") ?? [])
      .find((button) => button.textContent?.includes("Add entry"));
    act(() => addEntryButton?.click());

    const entries = experienceCard?.querySelectorAll(".entry-card") ?? [];
    expect(entries).toHaveLength(2);
    expect(entries[0]?.querySelector<HTMLButtonElement>("button:nth-child(1)")?.textContent).not.toBeNull();
    expect(Array.from(entries[0]?.querySelectorAll("button") ?? []).find((button) => button.textContent === "Move up")?.disabled).toBe(true);
    expect(Array.from(entries[1]?.querySelectorAll("button") ?? []).find((button) => button.textContent === "Move up")?.disabled).toBe(false);
    expect(Array.from(entries[1]?.querySelectorAll("button") ?? []).find((button) => button.textContent === "Move down")?.disabled).toBe(true);

    act(() => root.unmount());
    container.remove();
  });
});
