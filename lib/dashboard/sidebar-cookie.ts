/** Written by the shadcn `SidebarProvider` on every toggle ("true" = expanded). */
export const SIDEBAR_COOKIE = "sidebar_state";

/** Defaults to expanded when the cookie is absent. */
export function isSidebarOpen(value: string | undefined) {
  return value !== "false";
}
