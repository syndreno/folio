export const MAX_PROFILE_PHOTO_BYTES = 3 * 1024 * 1024;
export const SUPPORTED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateProfilePhoto(file: Pick<File, "size" | "type">): string | null {
  if (!SUPPORTED_PROFILE_PHOTO_TYPES.includes(file.type as (typeof SUPPORTED_PROFILE_PHOTO_TYPES)[number])) {
    return "Choose a JPG, PNG, or WebP profile photo.";
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return "The profile photo is larger than the supported 3 MB limit.";
  }
  return null;
}

export function readProfilePhoto(file: File): Promise<string> {
  const validationError = validateProfilePhoto(file);
  if (validationError) return Promise.reject(new Error(validationError));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The profile photo could not be read."));
    });
    reader.addEventListener("error", () => reject(new Error("The profile photo could not be read.")));
    reader.readAsDataURL(file);
  });
}
