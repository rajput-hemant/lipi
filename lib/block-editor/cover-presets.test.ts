import { describe, expect, it } from "vitest";

import { coverStyleForBannerUrl, documentCoverPresets } from "./cover-presets";

describe("coverStyleForBannerUrl", () => {
  it("returns undefined for null or undefined bannerUrl", () => {
    expect(coverStyleForBannerUrl(null)).toBeUndefined();
    expect(coverStyleForBannerUrl(undefined)).toBeUndefined();
  });

  it("returns preset style for preset ids", () => {
    for (const preset of documentCoverPresets) {
      expect(coverStyleForBannerUrl(preset.id)).toBe(preset.style);
    }
  });

  it("returns url(customUrl) for uploaded image URLs", () => {
    const customUrl = "https://utfs.io/f/sample-uploaded-banner.png";
    expect(coverStyleForBannerUrl(customUrl)).toBe(`url("${customUrl}")`);
  });
});
