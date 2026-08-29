// @vitest-environment node

import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  deleteResumeDraft,
  loadResumeDraft,
  saveResumeDraft,
} from "../services/resumeDraftStore";

afterEach(async () => {
  await deleteResumeDraft();
});

describe("browser-local resume drafts", () => {
  it("saves, replaces, restores, and deletes the active Markdown draft", async () => {
    const first = await saveResumeDraft("# First", "first-resume.md", "2026-08-29T09:00:00.000Z");
    expect(first.fileName).toBe("first-resume.md");
    expect(await loadResumeDraft()).toEqual(first);

    const second = await saveResumeDraft("# Updated", "updated-resume.md", "2026-08-29T10:00:00.000Z");
    expect(await loadResumeDraft()).toEqual(second);

    await deleteResumeDraft();
    expect(await loadResumeDraft()).toBeNull();
  });
});
