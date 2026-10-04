import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import NewWorkspaceLoading from "./loading";

describe("NewWorkspaceLoading", () => {
  it("renders a form-shaped skeleton without the editor shell", () => {
    const html = renderToStaticMarkup(<NewWorkspaceLoading />);

    expect(html).toContain("min-h-dvh");
    expect(html).not.toContain("h-screen");
    expect(html).not.toContain("w-64");
    expect(html).toContain('data-slot="skeleton"');
  });
});
