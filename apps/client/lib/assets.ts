/** Build a public asset URL that also works when deployed below a base path. */
export function assetPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${basePath}/${path.replace(/^\//, "")}`;
}
