import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load(appUrl: string | undefined) {
  vi.resetModules();
  if (appUrl) vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl);
  else vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
  const robots = (await import("./robots")).default();
  const sitemap = (await import("./sitemap")).default();
  const { siteConfig } = await import("@/config/site");
  return { robots, sitemap, siteConfig };
}

describe("robots and sitemap host", () => {
  it("uses NEXT_PUBLIC_APP_URL when set", async () => {
    const { robots, sitemap } = await load("https://preview.example.com");

    expect(robots.sitemap).toBe("https://preview.example.com/sitemap.xml");
    expect(
      sitemap.every((e) => e.url.startsWith("https://preview.example.com"))
    ).toBe(true);
  });

  it("falls back to the site host when unset", async () => {
    const { robots, sitemap, siteConfig } = await load(undefined);

    expect(robots.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    expect(sitemap[0].url).toBe(siteConfig.url);
  });
});
