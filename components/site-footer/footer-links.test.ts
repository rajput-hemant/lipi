import { describe, expect, it, vi } from "vitest";

import { footerLinks } from "./footer";

vi.mock("next/server", () => ({ connection: vi.fn() }));

describe("footerLinks", () => {
  it("has one group per title", () => {
    const titles = footerLinks.map((section) => section.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("points internal links at real app routes", () => {
    const links: readonly { href: string; external?: true }[] =
      footerLinks.flatMap((section) => [...section.links]);
    const internal = links
      .filter((link) => !("external" in link))
      .map((link) => link.href);
    expect(internal).toEqual(
      expect.arrayContaining(["/privacy", "/terms", "/pricing"])
    );
    expect(internal.every((href) => href.startsWith("/"))).toBe(true);
  });
});
