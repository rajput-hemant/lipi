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
  useAppActions: () => ({
    addDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-subscription-modal", () => ({
  useSubscriptionModal: () => ({
    setOpen: vi.fn(),
  }),
}));

vi.mock("@/lib/db/queries", () => ({
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  duplicateDocument: vi.fn(),
  countChildren: vi.fn(() => 1),
  hasWorkspaceProPlan: vi.fn().mockResolvedValue(true),
}));

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("DocumentTree Keyboard Context Menu", () => {
  it("dispatches contextmenu event when Shift+F10 is pressed on tree row", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<DocumentTree />);
    });

    const link = document.getElementById("document-tree-item-doc-1");
    expect(link).toBeTruthy();

    const row = link?.closest('[role="treeitem"]');
    expect(row).toBeTruthy();

    let contextMenuFired = false;
    row?.addEventListener("contextmenu", () => {
      contextMenuFired = true;
    });

    act(() => {
      link?.focus();
      const event = new KeyboardEvent("keydown", {
        key: "F10",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      link?.dispatchEvent(event);
    });

    expect(contextMenuFired).toBe(true);
  });
});
