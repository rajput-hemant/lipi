import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} - All-in-one collaborative workspace`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Satori reads woff/ttf/otf only; Virgil is woff2, so the brand uses Cal Sans.
  const heading = await readFile(
    join(process.cwd(), "public/fonts/CalSans-SemiBold.woff")
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "Cal Sans",
      }}
    >
      <div style={{ fontSize: 168, lineHeight: 1 }}>{siteConfig.name}</div>
      <div style={{ fontSize: 44, color: "#a3a3a3" }}>
        All-in-one collaborative workspace
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Cal Sans", data: heading, style: "normal", weight: 600 },
      ],
    }
  );
}
