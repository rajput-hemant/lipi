import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LobbyMobileMenu } from "./lobby-mobile-menu";
import { LobbyNavbar } from "./lobby-navbar";

describe("lobby touch targets", () => {
  it("grows Login and Sign Up to 44px for coarse pointers", () => {
    const html = renderToStaticMarkup(<LobbyNavbar />);
    expect(html.match(/pointer-coarse:h-11/g)).toHaveLength(2);
  });

  it("grows the mobile menu trigger to 44px for coarse pointers", () => {
    expect(renderToStaticMarkup(<LobbyMobileMenu />)).toContain(
      "pointer-coarse:size-11"
    );
  });
});
