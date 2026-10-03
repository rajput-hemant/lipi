"use client";

import { useSyncExternalStore } from "react";

import { formatUpdatedDate } from "./workspace-pages";

const subscribe = () => () => {};

/**
 * Renders the same UTC date on the server and during hydration, then switches
 * to the viewer's locale and time zone once mounted.
 */
export function UpdatedDate({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () =>
      formatUpdatedDate(
        iso,
        navigator.language,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      ),
    () => formatUpdatedDate(iso)
  );

  return <time dateTime={iso}>{text}</time>;
}
