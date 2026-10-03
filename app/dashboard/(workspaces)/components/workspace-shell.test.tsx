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

import { useSidebar } from "@/components/ui/sidebar";
import { isSidebarOpen, SIDEBAR_COOKIE } from "@/lib/dashboard/sidebar-cookie";
import { WorkspaceShell } from "./workspace-shell";

vi.mock("@/components/sidebar/app-sidebar", () => ({
  AppSidebar: function AppSidebar() {
    const { state } = useSidebar();
    return <aside data-testid="sidebar" data-state={state} />;
  },
}));

vi.mock("@/components/site-header/navbar", async () => {
  const { SidebarTrigger } = await import("@/components/ui/sidebar");
  return { Navbar: () => <SidebarTrigger /> };
});

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

function renderShell(defaultOpen: boolean, content: React.ReactNode = "Main") {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() =>
    root.render(
      <WorkspaceShell defaultOpen={defaultOpen}>{content}</WorkspaceShell>
    )
  );
  return container;
}

describe("WorkspaceShell", () => {
  it("toggles between two states and persists the choice in the shadcn cookie", () => {
    const container = renderShell(true);
    const sidebar = container.querySelector("[data-testid=sidebar]");
    const toggle = container.querySelector("button")!;

    expect(sidebar?.getAttribute("data-state")).toBe("expanded");

    act(() => toggle.click());

    expect(sidebar?.getAttribute("data-state")).toBe("collapsed");
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=false`);

    act(() => toggle.click());

    expect(sidebar?.getAttribute("data-state")).toBe("expanded");
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=true`);
  });

  it("renders collapsed on first paint from the server default", () => {
    const container = renderShell(false);

    expect(
      container
        .querySelector("[data-testid=sidebar]")
        ?.getAttribute("data-state")
    ).toBe("collapsed");
    expect(container.querySelector('[role="separator"]')).toBeNull();
  });

  it("uses dvh for the shell height and keeps the 56px icon rail", () => {
    const wrapper = renderShell(true).querySelector<HTMLElement>(
      '[data-slot="sidebar-wrapper"]'
    )!;

    expect(wrapper.className).toContain("min-h-dvh");
    expect(wrapper.className).not.toContain("min-h-svh");
    expect(wrapper.style.getPropertyValue("--sidebar-width-icon")).toBe(
      "3.5rem"
    );
  });

  it("keeps Mod+B for the editor's bold instead of toggling the sidebar", () => {
    const container = renderShell(
      true,
      <div
        contentEditable
        suppressContentEditableWarning
        data-testid="editor"
      />
    );
    const editor = container.querySelector("[data-testid=editor]")!;
    const sidebar = container.querySelector("[data-testid=sidebar]");
    // The editor handles bold at the target, before React and the window.
    editor.addEventListener("keydown", (event) => event.preventDefault());

    act(() => {
      editor.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "b",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        })
      );
    });

    expect(sidebar?.getAttribute("data-state")).toBe("expanded");

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", ctrlKey: true })
      );
    });

    expect(sidebar?.getAttribute("data-state")).toBe("collapsed");
  });
});

describe("isSidebarOpen", () => {
  it("is open unless the cookie says false", () => {
    expect(isSidebarOpen(undefined)).toBe(true);
    expect(isSidebarOpen("true")).toBe(true);
    expect(isSidebarOpen("false")).toBe(false);
  });
});
