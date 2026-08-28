import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("desktop workspace pane toggles", () => {
  it("expands either pane and restores split view", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<App />));
    const createButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());

    expect(container.querySelector(".workspace")?.classList.contains("both-panes")).toBe(true);

    const hidePreview = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Hide preview pane"]',
    );
    expect(hidePreview?.querySelector("svg")?.getAttribute("data-icon")).toBe("caret-right");
    act(() => hidePreview?.click());
    expect(container.querySelector(".workspace")?.classList.contains("editor-panes")).toBe(true);
    const showPreview = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Show preview pane"]',
    );
    expect(showPreview?.getAttribute("aria-pressed")).toBe("false");
    expect(showPreview?.querySelector("svg")?.getAttribute("data-icon")).toBe("caret-right");

    act(() => showPreview?.click());
    expect(container.querySelector(".workspace")?.classList.contains("both-panes")).toBe(true);

    const hideEditor = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Hide editor pane"]',
    );
    expect(hideEditor?.querySelector("svg")?.getAttribute("data-icon")).toBe("caret-left");
    act(() => hideEditor?.click());
    expect(container.querySelector(".workspace")?.classList.contains("preview-panes")).toBe(true);
    const showEditor = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Show editor pane"]',
    );
    expect(showEditor?.getAttribute("aria-pressed")).toBe("false");
    expect(showEditor?.querySelector("svg")?.getAttribute("data-icon")).toBe("caret-left");

    act(() => root.unmount());
    container.remove();
  });
});
