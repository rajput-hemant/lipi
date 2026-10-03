import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  it("links to the main landmark and is visible on focus", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("focus:not-sr-only");
  });
});
