// @vitest-environment happy-dom

import React, { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  RESIZABLE_COLLAPSED_COOKIE,
  RESIZABLE_LAYOUT_COOKIE,
} from "@/lib/dashboard/resizable-layout-cookies";
import { ResizableLayout } from "./resizable-layout";

const setCookie = vi.fn();

vi.mock("cookies-next", () => ({
  setCookie: (...args: unknown[]) => setCookie(...args),
}));

vi.mock("@/components/sidebar/sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

vi.mock("@/components/site-header/navbar", () => ({
  Navbar: () => <nav data-testid="navbar" />,
}));

vi.mock("@/components/ui/resizable", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/ui/resizable")>();

  function ResizablePanelGroup({
    onLayoutChange,
    ...props
  }: React.ComponentProps<typeof actual.ResizablePanelGroup>) {
    useEffect(() => {
      onLayoutChange?.({ sidebar: 16, main: 84 });
    }, [onLayoutChange]);
    return (
      <actual.ResizablePanelGroup onLayoutChange={onLayoutChange} {...props} />
    );
  }

  function ResizablePanel({
    id,
    onResize,
    ...props
  }: React.ComponentProps<typeof actual.ResizablePanel>) {
    useEffect(() => {
      if (id === "sidebar") {
        onResize?.({ asPercentage: 2, inPixels: 24 }, "sidebar", undefined);
      }
    }, [id, onResize]);
    return <actual.ResizablePanel id={id} onResize={onResize} {...props} />;
  }

  return {
    ...actual,
    ResizablePanelGroup,
    ResizablePanel,
  };
});

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  setCookie.mockClear();
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("ResizableLayout", () => {
  it("uses the v4 horizontal panel group and persists layout and collapse cookies", async () => {
    const container = document.createElement("div");
    container.style.width = "1200px";
    container.style.height = "800px";
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() =>
      root.render(
        <ResizableLayout defaultLayout={[16, 84]} defaultCollapsed={false}>
          <div data-testid="workspace-main">Main</div>
        </ResizableLayout>
      )
    );

    const group = container.querySelector(
      '[data-slot="resizable-panel-group"]'
    );
    expect(group).toBeTruthy();

    const panels = container.querySelectorAll('[data-slot="resizable-panel"]');
    expect(panels).toHaveLength(2);
    expect(panels[0]?.id).toBe("sidebar");
    expect(panels[1]?.id).toBe("main");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(setCookie).toHaveBeenCalledWith(
      RESIZABLE_LAYOUT_COOKIE,
      JSON.stringify([16, 84])
    );
    expect(setCookie).toHaveBeenCalledWith(RESIZABLE_COLLAPSED_COOKIE, true);
  });
});
