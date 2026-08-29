import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createBlankResume } from "../domain/resume.defaults";
import { ClassicTemplate } from "../features/templates/classic/ClassicTemplate";
import { MAX_PROFILE_PHOTO_BYTES, validateProfilePhoto } from "../features/photo/photoFile";

describe("profile photos", () => {
  it("validates local raster image types and size", () => {
    expect(validateProfilePhoto({ type: "image/png", size: 1024 })).toBeNull();
    expect(validateProfilePhoto({ type: "image/svg+xml", size: 1024 })).toContain("JPG, PNG, or WebP");
    expect(validateProfilePhoto({ type: "image/jpeg", size: MAX_PROFILE_PHOTO_BYTES + 1 })).toContain("3 MB");
  });

  it("renders photo text-independently only in the supported template", () => {
    const resume = createBlankResume();
    resume.personal.photo = "data:image/png;base64,aGVsbG8=";
    resume.design.showPhoto = true;

    const classicMarkup = renderToStaticMarkup(<ClassicTemplate resume={resume} />);
    expect(classicMarkup).not.toContain("resume-photo");

    resume.design.templateId = "professional";
    const professionalMarkup = renderToStaticMarkup(<ClassicTemplate resume={resume} />);
    expect(professionalMarkup).toContain("resume-photo");
    expect(professionalMarkup).toContain("data:image/png;base64,aGVsbG8=");
    expect(professionalMarkup).toContain("Your Name");
  });
});
