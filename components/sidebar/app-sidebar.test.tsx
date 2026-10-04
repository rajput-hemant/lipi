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

import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";

const mockAccess = vi.hoisted(() => ({ value: "edit" }));

vi.mock("@/hooks/use-app-state", () => ({
  useAppState: () => ({ user: null }),
  usePageAccess: () => mockAccess.value,
}));

vi.mock("../icons", () => ({
  Logo: () => <span data-testid="logo" />,
}));

vi.mock("../settings", () => ({ Settings: () => <div /> }));
vi.mock("../sign-out", () => ({ SignOut: () => <button>Sign out</button> }));
vi.mock("../trash", () => ({ Trash: () => <div /> }));
vi.mock("../workspaces", () => ({ Workspaces: () => <div /> }));
vi.mock("./document-tree", () => ({
  DocumentTree: () => <div data-testid="document-tree" />,
}));
vi.mock("./document-tree-collapsed", () => ({
  DocumentTreeCollapsed: () => <div data-testid="document-tree-collapsed" />,
}));

vi.mock("../ui/avatar", () => ({
  Avatar: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  AvatarFallback: ({ children }: React.PropsWithChildren) => (
    <span>{children}</span>
  ),
  AvatarImage: () => null,
}));

vi.mock("../ui/popover", () => ({
  Popover: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  PopoverContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: React.PropsWithChildren) => (
    <button data-testid="account-trigger">{children}</button>
  ),
}));

const roots: ReturnType<typeof createRoot>[] = [];
const desktopWidth = window.innerWidth;

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

function renderSidebar(defaultOpen: boolean, width = desktopWidth) {
  window.innerWidth = width;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() =>
    root.render(
      <SidebarProvider defaultOpen={defaultOpen}>
        <SidebarTrigger />
        <AppSidebar />
      </SidebarProvider>
    )
  );
  return container;
}

const navButtons = (container: ParentNode) => [
  ...container.querySelectorAll<HTMLElement>(
    '[data-slot="sidebar-group-content"] button'
  ),
];

afterEach(() => {
  mockAccess.value = "edit";
  window.innerWidth = desktopWidth;
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("app sidebar", () => {
  it("collapses to an icon rail with dialog triggers, tooltips and the popover tree", () => {
    const container = renderSidebar(false);
    const sidebar = container.querySelector('[data-slot="sidebar"]');
    const buttons = navButtons(container);

    expect(sidebar?.getAttribute("data-state")).toBe("collapsed");
    expect(sidebar?.getAttribute("data-collapsible")).toBe("icon");
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "My Workspaces",
      "Settings",
      "Trash",
    ]);
    expect(buttons.map((b) => b.getAttribute("aria-haspopup"))).toEqual([
      "dialog",
      "dialog",
      "dialog",
    ]);
    expect(
      buttons.every((b) => b.hasAttribute("data-base-ui-tooltip-trigger"))
    ).toBe(true);
    const collapsedTree = container.querySelector(
      '[data-testid="document-tree-collapsed"]'
    );
    expect(collapsedTree).not.toBeNull();
    expect(collapsedTree?.getAttribute("data-testid")).toBe(
      "document-tree-collapsed"
    );
    expect(container.querySelector('[data-testid="document-tree"]')).toBeNull();
    const accountTrigger = container.querySelector(
      '[data-testid="account-trigger"]'
    );
    expect(accountTrigger).not.toBeNull();
    expect(accountTrigger?.getAttribute("data-testid")).toBe("account-trigger");
  });

  it("shows the full tree and user card when expanded", () => {
    const container = renderSidebar(true);

    expect(
      container
        .querySelector('[data-slot="sidebar"]')
        ?.getAttribute("data-state")
    ).toBe("expanded");
    const fullTree = container.querySelector('[data-testid="document-tree"]');
    expect(fullTree).not.toBeNull();
    expect(fullTree?.getAttribute("data-testid")).toBe("document-tree");
    expect(
      container.querySelector('[data-testid="account-trigger"]')
    ).toBeNull();
    expect(container.textContent).toContain("Sign out");
  });

  it("renders a keyboard-reachable rail that toggles the sidebar", () => {
    const container = renderSidebar(true);
    const rail = container.querySelector<HTMLElement>(
      '[data-slot="sidebar-rail"]'
    );

    act(() => rail?.click());

    expect(
      container
        .querySelector('[data-slot="sidebar"]')
        ?.getAttribute("data-state")
    ).toBe("collapsed");
  });

  it("toggles with Ctrl+B and persists the choice in the shadcn cookie", () => {
    const container = renderSidebar(true);
    const state = () =>
      container
        .querySelector('[data-slot="sidebar"]')
        ?.getAttribute("data-state");

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", ctrlKey: true })
      );
    });

    expect(state()).toBe("collapsed");
    expect(document.cookie).toContain("sidebar_state=false");

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", metaKey: true })
      );
    });

    expect(state()).toBe("expanded");
    expect(document.cookie).toContain("sidebar_state=true");
  });

  it("opens the full sidebar in a sheet on mobile even when the desktop state is collapsed", () => {
    const container = renderSidebar(false, 500);

    expect(container.querySelector('[data-slot="sidebar"]')).toBeNull();

    act(() =>
      container
        .querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')
        ?.click()
    );

    const sheet = document.querySelector('[data-mobile="true"]');
    expect(sheet).not.toBeNull();
    expect(sheet?.getAttribute("data-mobile")).toBe("true");
    const sheetTree = sheet?.querySelector('[data-testid="document-tree"]');
    expect(sheetTree).not.toBeNull();
    expect(sheetTree?.getAttribute("data-testid")).toBe("document-tree");
    expect(
      sheet?.querySelector('[data-testid="document-tree-collapsed"]')
    ).toBeNull();
  });

  it.each([
    ["edit", "Restore or delete trashed pages"],
    ["unknown", "Restore or delete trashed pages"],
    ["view", "Browse pages in the trash"],
  ])("describes the Trash dialog for %s access", (access, description) => {
    mockAccess.value = access;
    const container = renderSidebar(true);
    const trash = navButtons(container).find(
      (button) => button.textContent?.trim() === "Trash"
    );
    act(() => trash?.click());

    expect(
      document.querySelector('[data-slot="dialog-description"]')?.textContent
    ).toBe(description);
  });

  it("keeps dialogs within the viewport on small screens", () => {
    const container = renderSidebar(true);
    const settings = navButtons(container).find(
      (button) => button.textContent?.trim() === "Settings"
    );
    act(() => settings?.click());

    const content = document.querySelector('[data-slot="dialog-content"]');
    expect(content?.className).toContain("max-h-[calc(100dvh-2rem)]");
    expect(content?.className).toContain("sm:max-w-4xl");
  });

  it("sizes the fixed sidebar with dvh instead of svh", () => {
    const container = renderSidebar(true);
    const className = container.querySelector(
      '[data-slot="sidebar-container"]'
    )?.className;

    expect(className).toContain("h-dvh");
    expect(className).not.toContain("h-svh");
  });
});
