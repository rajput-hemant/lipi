import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import NewWorkspaceLoading from "./loading";

describe("NewWorkspaceLoading", () => {
  it("mirrors the setup layout on the dynamic viewport, not the editor shell", () => {
    const html = renderToStaticMarkup(<NewWorkspaceLoading />);

    expect(html).toContain("min-h-dvh");
    expect(html).not.toMatch(/h-screen|min-h-screen/);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading workspace setup");
    expect(html).not.toContain("w-64");
    expect(html).not.toContain("max-w-3xl");
  });
});
