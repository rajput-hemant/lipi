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

import { SidebarProvider } from "../ui/sidebar";
import { DocumentTree } from "./document-tree";

const mockDocuments = [
  {
    id: "doc-1",
    workspaceId: "ws-1",
    parentId: null,
    title: "Getting Started",
    icon: null,
    bannerUrl: null,
    inTrash: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/ws-1/doc-1",
}));

vi.mock("@/hooks/use-app-state", () => ({
  useAppState: () => ({
    documents: mockDocuments,
    user: { id: "user-1", email: "test@example.com" },
    workspace: { id: "ws-1", title: "Test WS" },
    replaceDocuments: vi.fn(),
    addDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  }),
  useCanEditPages: () => true,
  usePageAccess: () => "edit",
}));

vi.mock("@/hooks/use-subscription-modal", () => ({
  useSubscriptionModal: () => ({
    setOpen: vi.fn(),
  }),
}));

vi.mock("@/lib/db/actions/document", () => ({
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  softDeleteDocumentTree: vi.fn(),
  duplicateDocument: vi.fn(),
}));

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.clearAllMocks();
});

function renderTree() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <SidebarProvider>
        <DocumentTree />
      </SidebarProvider>
    );
  });
  const link = document.getElementById("document-tree-item-doc-1");
  const row = link?.closest('[role="treeitem"]');
  return { link, row };
}

function pressOnLink(
  link: HTMLElement | null | undefined,
  init: KeyboardEventInit
) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    link?.focus();
    link?.dispatchEvent(event);
  });
  return event;
}

describe("DocumentTree Keyboard Context Menu", () => {
  it("dispatches contextmenu event when Shift+F10 is pressed on tree row", () => {
    const { link, row } = renderTree();
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/dashboard/ws-1/doc-1");
    expect(link?.textContent).toContain("Getting Started");
    expect(row?.getAttribute("role")).toBe("treeitem");

    let contextMenuFired = false;
    row?.addEventListener("contextmenu", () => {
      contextMenuFired = true;
    });

    const event = pressOnLink(link, { key: "F10", shiftKey: true });

    expect(contextMenuFired).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("dispatches contextmenu event when the ContextMenu key is pressed", () => {
    const { link, row } = renderTree();
    let contextMenuFired = false;
    row?.addEventListener("contextmenu", () => {
      contextMenuFired = true;
    });

    const event = pressOnLink(link, { key: "ContextMenu" });

    expect(contextMenuFired).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("ignores F10 without Shift", () => {
    const { link, row } = renderTree();
    let contextMenuFired = false;
    row?.addEventListener("contextmenu", () => {
      contextMenuFired = true;
    });

    const event = pressOnLink(link, { key: "F10" });

    expect(contextMenuFired).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });
});
