import { describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

vi.mock("@/lib/utils", () => ({
  absoluteUrl: (path: string) => `https://preview.example${path}`,
}));

describe("SEO host", () => {
  it("derives sitemap and robots URLs from absoluteUrl", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://preview.example");
    expect(urls).toContain("https://preview.example/pricing");
    expect(robots().sitemap).toBe("https://preview.example/sitemap.xml");
  });
});
