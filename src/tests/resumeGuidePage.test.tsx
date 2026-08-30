import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("resume import guide", () => {
  it("opens from the home menu with both AI workflows and copy-ready prompts", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await act(async () => root.render(<App />));
    const guideButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.trim() === "Guide");
    act(() => guideButton?.click());

    expect(container.querySelector(".guide-page-shell")).not.toBeNull();
    expect(container.textContent).toContain("Bring your resume into Folio");
    expect(container.textContent).toContain("Improve an existing Folio .md file");
    expect(container.textContent).toContain("Convert an existing resume PDF");
    expect(container.textContent).toContain("An external AI service may not");
    expect(container.querySelectorAll(".guide-prompt-card pre")).toHaveLength(2);

    const templateLink = container.querySelector<HTMLAnchorElement>(
      'a[download][href$="examples/resume-template.md"]',
    );
    expect(templateLink).not.toBeNull();

    const copyButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Copy prompt"));
    await act(async () => {
      copyButton?.click();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("source of truth"));
    expect(copyButton?.textContent).toContain("Copied");

    const backButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Back to home"));
    act(() => backButton?.click());
    expect(container.querySelector(".welcome-shell")).not.toBeNull();
  });

  it("opens from the editor and returns without replacing the current resume", async () => {
    await act(async () => root.render(<App />));
    const createButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());

    expect(container.querySelector(".builder-app")).not.toBeNull();
    const guideButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Open resume guide"]',
    );
    act(() => guideButton?.click());

    expect(container.querySelector(".guide-page-shell")).not.toBeNull();
    const backButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Back to editor"));
    act(() => backButton?.click());

    expect(container.querySelector(".builder-app")).not.toBeNull();
    expect(container.textContent).toContain("Your Name");
  });
});
