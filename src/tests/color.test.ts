import { describe, expect, it } from "vitest";
import { contrastRatio } from "../utils/color";

describe("contrastRatio", () => {
  it("returns the WCAG maximum for black and white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
  });

  it("returns one for identical colors", () => {
    expect(contrastRatio("#245B4E", "#245B4E")).toBeCloseTo(1, 2);
  });
});
