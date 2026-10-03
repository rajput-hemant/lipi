type PageRow = {
  id: string;
  parentId: string | null;
  title: string;
  updatedAt: string;
};

export type WorkspacePageItem<T extends PageRow> = T & {
  parentTitle: string | null;
};

/** Most recently updated first; ties fall back to id so the order is stable. */
export function sortByRecentlyUpdated<T extends PageRow>(pages: T[]) {
  return [...pages].sort(
    (a, b) =>
      Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
      a.id.localeCompare(b.id)
  );
}

/** Adds the parent's title to subpages whose parent is among `pages`. */
export function withParentTitles<T extends PageRow>(
  pages: T[]
): WorkspacePageItem<T>[] {
  const byId = new Map(pages.map((page) => [page.id, page]));

  return pages.map((page) => {
    const parent = page.parentId ? byId.get(page.parentId) : undefined;
    return { ...page, parentTitle: parent ? parent.title || "Untitled" : null };
  });
}

const FALLBACK_LOCALE = "en-US";

/**
 * Formats a short "Mar 4" style date. Without a locale and time zone it is
 * deterministic (en-US, UTC), which is what the server render uses.
 */
export function formatUpdatedDate(
  iso: string,
  locale = FALLBACK_LOCALE,
  timeZone = "UTC"
) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(date);
}
