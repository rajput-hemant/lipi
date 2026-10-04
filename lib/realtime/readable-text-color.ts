function channel(value: number) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Black or white, whichever has the higher WCAG contrast on a `#rrggbb` background. */
export function readableTextColor(background: string) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(background);
  if (!match) return "#ffffff";

  const [r, g, b] = match.slice(1).map((hex) => channel(parseInt(hex, 16)));
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;

  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05) ?
      "#000000"
    : "#ffffff";
}
