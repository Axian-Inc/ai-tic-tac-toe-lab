export function ensureProjectTaggedName(
  value: string,
  label: string,
  projectTag: string,
): void {
  if (!value.includes(projectTag)) {
    throw new Error(`${label} must include '${projectTag}'.`);
  }
}
