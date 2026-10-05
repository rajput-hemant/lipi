import { describe, expect, it } from "vitest";

import { readableTextColor } from "./readable-text-color";

function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const presenceColors = [
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#8b5cf6",
  "#ca8a04",
  "#dc2626",
];

describe("readableTextColor", () => {
  it("keeps every presence colour at WCAG AA for small text", () => {
    for (const color of presenceColors) {
      expect(contrast(color, readableTextColor(color))).toBeGreaterThanOrEqual(
        4.5
      );
    }
  });

  it("picks dark text on light backgrounds and white on dark", () => {
    expect(readableTextColor("#ca8a04")).toBe("#000000");
    expect(readableTextColor("#dc2626")).toBe("#ffffff");
  });

  it("falls back to white for non-hex colours", () => {
    expect(readableTextColor("rebeccapurple")).toBe("#ffffff");
  });
});
