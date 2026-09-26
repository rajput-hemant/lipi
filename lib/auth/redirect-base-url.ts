export function getRedirectBaseURL(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}
