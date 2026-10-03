import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DashboardLoading from "./loading";

describe("DashboardLoading", () => {
  it("fills the dynamic viewport and shows the sidebar skeleton from md up", () => {
    const html = renderToStaticMarkup(<DashboardLoading />);

    expect(html).toContain("h-dvh");
    expect(html).not.toContain("h-screen");
    expect(html).toContain("md:flex");
    expect(html).not.toContain("lg:flex");
  });
});
