export function parseBulletDraft(value: string): string[] {
  return value
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
}
