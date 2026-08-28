import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("status notifications", () => {
  it("automatically dismisses a notification on the home page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unavailable")));

    await act(async () => root.render(<App />));
    const loadExampleButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Load a complete example"));

    await act(async () => {
      loadExampleButton?.click();
      await Promise.resolve();
    });

    expect(container.querySelector(".toast")?.textContent).toContain(
      "The example resume could not be loaded.",
    );

    act(() => vi.advanceTimersByTime(5000));

    expect(container.querySelector(".toast")).toBeNull();
  });

  it("uses an in-app dialog before returning to the start screen", async () => {
    await act(async () => root.render(<App />));
    const createButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());

    act(() => container.querySelector<HTMLButtonElement>(".brand-button")?.click());

    const dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.textContent).toContain("Return to the start screen?");
    expect(dialog?.textContent).toContain("Download .md");
    expect(document.activeElement?.textContent).toBe("Cancel");

    const returnHomeButton = Array.from(dialog?.querySelectorAll("button") ?? [])
      .find((button) => button.textContent === "Return home");
    act(() => returnHomeButton?.click());

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector(".welcome-shell")).not.toBeNull();
  });

  it("uses an in-app confirmation before deleting a section", async () => {
    await act(async () => root.render(<App />));
    const createButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());

    const sectionCount = container.querySelectorAll("[data-editor-section-id]").length;
    act(() =>
      container.querySelector<HTMLButtonElement>('button[aria-label="Delete Experience"]')?.click(),
    );

    let dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.textContent).toContain("Delete this section?");
    expect(dialog?.textContent).toContain("Experience");
    expect(document.activeElement?.textContent).toBe("Cancel");
    expect(container.querySelectorAll("[data-editor-section-id]")).toHaveLength(sectionCount);

    act(() =>
      Array.from(dialog?.querySelectorAll("button") ?? [])
        .find((button) => button.textContent === "Cancel")
        ?.click(),
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelectorAll("[data-editor-section-id]")).toHaveLength(sectionCount);

    act(() =>
      container.querySelector<HTMLButtonElement>('button[aria-label="Delete Experience"]')?.click(),
    );
    dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    act(() =>
      Array.from(dialog?.querySelectorAll("button") ?? [])
        .find((button) => button.textContent === "Delete section")
        ?.click(),
    );

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelectorAll("[data-editor-section-id]")).toHaveLength(sectionCount - 1);
    expect(container.querySelector(".message-bar")?.textContent).toContain(
      "Experience was deleted.",
    );
  });

  it("warns before the browser closes while a resume is open", async () => {
    await act(async () => root.render(<App />));

    const beforeEditing = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(beforeEditing)).toBe(true);
    expect(beforeEditing.defaultPrevented).toBe(false);

    const createButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Create a new resume"));
    act(() => createButton?.click());

    const whileEditing = new Event("beforeunload", { cancelable: true });
    let closeWasAllowed = true;
    act(() => {
      closeWasAllowed = window.dispatchEvent(whileEditing);
    });
    expect(closeWasAllowed).toBe(false);
    expect(whileEditing.defaultPrevented).toBe(true);
    const closeReminder = container.querySelector<HTMLElement>('[role="dialog"]');
    expect(closeReminder?.textContent).toContain("Download your Markdown before closing?");
    expect(closeReminder?.textContent).toContain("Download .md");
    expect(document.activeElement?.textContent).toBe("Continue editing");

    const continueEditingButton = Array.from(closeReminder?.querySelectorAll("button") ?? [])
      .find((button) => button.textContent === "Continue editing");
    act(() => continueEditingButton?.click());
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    act(() => container.querySelector<HTMLButtonElement>(".brand-button")?.click());
    const returnHomeButton = Array.from(
      container.querySelectorAll<HTMLElement>('[role="dialog"] button'),
    ).find((button) => button.textContent === "Return home");
    act(() => returnHomeButton?.click());

    const afterReturningHome = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(afterReturningHome)).toBe(true);
    expect(afterReturningHome.defaultPrevented).toBe(false);
  });
});
