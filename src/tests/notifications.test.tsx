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
});
