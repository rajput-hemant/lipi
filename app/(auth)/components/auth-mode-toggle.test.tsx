import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AuthModeToggle } from "./auth-mode-toggle";

const { nav } = vi.hoisted(() => ({
  nav: { pathname: "/login", search: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}));

function href() {
  return /href="([^"]*)"/.exec(renderToStaticMarkup(<AuthModeToggle />))![1];
}

describe("AuthModeToggle", () => {
  it("links login to signup", () => {
    Object.assign(nav, { pathname: "/login", search: "" });
    expect(href()).toBe("/signup");
  });

  it("keeps the from query when switching modes", () => {
    Object.assign(nav, { pathname: "/signup", search: "from=%2Finvite%2Ftok" });
    expect(href()).toBe("/login?from=%2Finvite%2Ftok");
  });
});
