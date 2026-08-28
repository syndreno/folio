import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { createPersonalLink } from "../domain/resume.defaults";
import type { PersonalLink } from "../domain/resume.types";
import { PersonalLinkEditor } from "../features/editor/PersonalLinkEditor";

function PersonalLinkHarness() {
  const [link, setLink] = useState<PersonalLink>(createPersonalLink);
  return (
    <PersonalLinkEditor
      link={link}
      onChange={(patch) => setLink((current) => ({ ...current, ...patch }))}
      onDelete={() => undefined}
    />
  );
}

describe("additional links editor", () => {
  it("uses a title field and visual icon picker instead of dropdowns", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<PersonalLinkHarness />));

    const labels = Array.from(container.querySelectorAll("label"), (label) =>
      label.firstChild?.textContent?.trim(),
    );
    expect(labels).toEqual(["Title", "Link URL"]);
    expect(container.querySelector("select")).toBeNull();

    const pickerTrigger = container.querySelector<HTMLButtonElement>(
      'button[aria-label="portfolio.example.com icon picker"]',
    );
    act(() => pickerTrigger?.click());
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();

    act(() =>
      container
        .querySelector<HTMLButtonElement>(
          'button[aria-label="Use GitHub icon for portfolio.example.com"]',
        )
        ?.click(),
    );
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(pickerTrigger?.textContent).toContain("GitHub");

    act(() => root.unmount());
    container.remove();
  });
});
