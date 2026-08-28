import { describe, expect, it } from "vitest";
import { paginatePreviewBlocks } from "../features/templates/classic/paginatePreviewBlocks";

describe("live preview pagination", () => {
  it("moves overflowing content onto a new sheet", () => {
    const pages = paginatePreviewBlocks([
      { id: "summary-heading", kind: "heading", height: 10 },
      { id: "summary", kind: "content", height: 35 },
      { id: "experience-heading", kind: "heading", height: 10 },
      { id: "experience-entry", kind: "content", height: 55 },
    ], 20, 100);

    expect(pages).toEqual([
      ["summary-heading", "summary"],
      ["experience-heading", "experience-entry"],
    ]);
  });

  it("does not leave a section heading orphaned at the bottom of a page", () => {
    const pages = paginatePreviewBlocks([
      { id: "skills", kind: "content", height: 65 },
      { id: "education-heading", kind: "heading", height: 10 },
      { id: "education-entry", kind: "content", height: 20 },
    ], 0, 80);

    expect(pages).toEqual([
      ["skills"],
      ["education-heading", "education-entry"],
    ]);
  });
});
