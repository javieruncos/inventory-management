const DEFAULT_PATH = "/";

export function getSafeNextPath(value: string | null | undefined): string {
  if (typeof value !== "string") {
    return DEFAULT_PATH;
  }

  const nextPath = value.trim();

  if (nextPath.length === 0) {
    return DEFAULT_PATH;
  }

  if (!nextPath.startsWith("/")) {
    return DEFAULT_PATH;
  }

  if (nextPath.startsWith("//") || nextPath.startsWith("/\\")) {
    return DEFAULT_PATH;
  }

  if (
    nextPath === "/login" ||
    nextPath.startsWith("/login?") ||
    nextPath.startsWith("/login#") ||
    nextPath.startsWith("/login/")
  ) {
    return DEFAULT_PATH;
  }

  return nextPath;
}

export function buildLoginPath(nextPath: string): string {
  return `/login?next=${encodeURIComponent(getSafeNextPath(nextPath))}`;
}
