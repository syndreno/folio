import { describe, expect, it } from "vitest";
import { parseBulletDraft } from "../features/editor/bulletDraft";

describe("bullet textarea drafts", () => {
  it("keeps a trailing newline compatible with the current bullet values", () => {
    const draft = "First achievement\nSecond achievement\n";

    expect(parseBulletDraft(draft)).toEqual([
      "First achievement",
      "Second achievement",
    ]);
  });

  it("ignores empty lines when updating the resume model", () => {
    expect(parseBulletDraft("First\n\n   \nSecond")).toEqual(["First", "Second"]);
  });
});
