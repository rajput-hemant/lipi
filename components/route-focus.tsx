"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const MAIN_ID = "main-content";

function isTyping(el: Element | null) {
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  );
}

/**
 * Moves focus to `#main-content` after a client-side navigation so keyboard and
 * screen-reader users do not stay on the link they clicked.
 *
 * Contract: every shell (lobby, auth, dashboard) renders one
 * `<main id="main-content" tabIndex={-1} className="outline-none">`; the same
 * id is the skip-link target. Focus is moved with `preventScroll`, so there is
 * no scroll jump or smooth-scroll animation and nothing to gate on
 * `prefers-reduced-motion`.
 */
export function RouteFocus() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;

    const main = document.getElementById(MAIN_ID);
    const active = document.activeElement;
    if (!main || main.contains(active) || isTyping(active)) return;
    main.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
