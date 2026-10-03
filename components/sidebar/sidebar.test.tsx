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

import { Sidebar } from "./sidebar";

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
    <button>{children}</button>
  ),
}));

vi.mock("../ui/separator", () => ({
  Separator: () => <hr />,
}));

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

function renderSidebar(isCollapsed: boolean) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(<Sidebar isCollapsed={isCollapsed} />));
  return container;
}

afterEach(() => {
  mockAccess.value = "edit";
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("sidebar navigation", () => {
  it("uses labeled icon-only dialog triggers with tooltips when collapsed", () => {
    const container = renderSidebar(true);
    const buttons = [...container.querySelectorAll("nav button")];

    expect(buttons).toHaveLength(3);
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "",
      "",
      "",
    ]);
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "My Workspaces",
      "Settings",
      "Trash",
    ]);
    expect(
      buttons.map((button) => button.getAttribute("aria-haspopup"))
    ).toEqual(["dialog", "dialog", "dialog"]);
    expect(
      buttons.every((button) =>
        button.hasAttribute("data-base-ui-tooltip-trigger")
      )
    ).toBe(true);
    expect(
      container.querySelector('[data-testid="document-tree-collapsed"]')
    ).toBeTruthy();
  });

  it("shows text labels when expanded", () => {
    const container = renderSidebar(false);
    const buttons = [...container.querySelectorAll("nav button")];

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "My Workspaces",
      "Settings",
      "Trash",
    ]);
    expect(
      container.querySelector('[data-testid="document-tree"]')
    ).toBeTruthy();
  });

  it.each([
    ["edit", "Restore or delete trashed pages"],
    ["unknown", "Restore or delete trashed pages"],
    ["view", "Browse pages in the trash"],
  ])("describes the Trash dialog for %s access", (access, description) => {
    mockAccess.value = access;
    const container = renderSidebar(false);
    const trash = [...container.querySelectorAll("nav button")].find(
      (button) => button.textContent?.trim() === "Trash"
    );
    act(() => (trash as HTMLElement).click());

    expect(
      document.querySelector('[data-slot="dialog-description"]')?.textContent
    ).toBe(description);
  });
});
