// @vitest-environment happy-dom

import React, { act } from "react";
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

import { SIDEBAR_COLLAPSED_COOKIE } from "@/lib/dashboard/sidebar-cookie";
import { WorkspaceShell } from "./workspace-shell";

const setCookie = vi.fn();

vi.mock("cookies-next", () => ({
  setCookie: (...args: unknown[]) => setCookie(...args),
}));

vi.mock("@/components/sidebar/sidebar", () => ({
  Sidebar: ({ isCollapsed }: { isCollapsed: boolean }) => (
    <aside data-testid="sidebar" data-collapsed={isCollapsed} />
  ),
}));

vi.mock("@/components/site-header/navbar", async () => {
  const { SidebarToggle } = await import("@/components/sidebar/sidebar-state");
  return { Navbar: () => <SidebarToggle /> };
});

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  setCookie.mockClear();
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

function renderShell(defaultCollapsed: boolean) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() =>
    root.render(
      <WorkspaceShell defaultCollapsed={defaultCollapsed}>
        <div>Main</div>
      </WorkspaceShell>
    )
  );
  return container;
}

describe("WorkspaceShell", () => {
  it("toggles between exactly two states and persists the choice", () => {
    const container = renderShell(false);
    const sidebar = container.querySelector("[data-testid=sidebar]");
    const toggle = container.querySelector("button")!;

    expect(sidebar?.getAttribute("data-collapsed")).toBe("false");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Collapse sidebar");

    act(() => toggle.click());

    expect(sidebar?.getAttribute("data-collapsed")).toBe("true");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("Expand sidebar");
    expect(setCookie).toHaveBeenLastCalledWith(
      SIDEBAR_COLLAPSED_COOKIE,
      true,
      expect.objectContaining({ path: "/" })
    );

    act(() => toggle.click());

    expect(sidebar?.getAttribute("data-collapsed")).toBe("false");
    expect(setCookie).toHaveBeenLastCalledWith(
      SIDEBAR_COLLAPSED_COOKIE,
      false,
      expect.objectContaining({ path: "/" })
    );
  });

  it("renders collapsed on first paint from the server default and has no resize handle", () => {
    const container = renderShell(true);

    expect(
      container
        .querySelector("[data-testid=sidebar]")
        ?.getAttribute("data-collapsed")
    ).toBe("true");
    expect(container.querySelector('[role="separator"]')).toBeNull();
  });
});
