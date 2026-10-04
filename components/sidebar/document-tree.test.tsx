// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { WorkspaceRecord } from "@/hooks/use-app-state";
import type { WorkspaceMembershipRole } from "@/lib/workspace/permissions";
import type { DocumentSummary } from "@/types/db";

import { AppStateContext, createAppStore } from "@/hooks/use-app-state";
import { SidebarProvider } from "../ui/sidebar";
import { TooltipProvider } from "../ui/tooltip";
import { DocumentTree } from "./document-tree";

const { createDocument, softDeleteDocumentTree, errorMessages } = vi.hoisted(
  () => ({
    createDocument: vi.fn(),
    softDeleteDocumentTree: vi.fn(),
    errorMessages: [] as unknown[],
  })
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/ws-1",
}));
vi.mock("@/components/realtime/workspace-realtime-provider", () => ({
  useNotifyWorkspacePageChanges: () => vi.fn(),
}));
vi.mock("../subscription-modal-provider", () => ({
  useSubscriptionModal: () => ({ setOpen: vi.fn(), hasProEntitlement: true }),
}));
vi.mock("@/lib/db/actions/document", () => ({
  createDocument,
  softDeleteDocumentTree,
  duplicateDocument: vi.fn(),
  updateDocument: vi.fn(),
}));
// Run the rejection callback the way sonner does.
vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    promise: (
      promise: Promise<unknown>,
      opts: { error: (e: unknown) => unknown }
    ) =>
      promise.catch((e) => {
        errorMessages.push(opts.error(e));
      }),
  },
}));

function doc(id: string, parentId: string | null = null): DocumentSummary {
  return {
    id,
    workspaceId: "ws-1",
    parentId,
    title: `Page ${id}`,
    icon: "",
    bannerUrl: null,
    inTrash: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function render(
  role: WorkspaceMembershipRole | null,
  documents = [doc("a"), doc("b")]
) {
  const store = createAppStore({
    user: null,
    workspace: { id: "ws-1" } as WorkspaceRecord,
    documents,
    role,
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <AppStateContext.Provider value={store}>
        <TooltipProvider>
          <SidebarProvider>
            <DocumentTree />
          </SidebarProvider>
        </TooltipProvider>
      </AppStateContext.Provider>
    );
  });
  return { store };
}

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const newPageButton = () =>
  document.querySelector<HTMLButtonElement>('button[aria-label="New page"]');

async function submitNewRootPage() {
  act(() => newPageButton()?.click());
  await act(async () => {
    document
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await flush();
}

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  errorMessages.length = 0;
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("DocumentTree viewer gating", () => {
  it("shows New page and no badge for editors", () => {
    render("editor");
    expect(newPageButton()).toBeInstanceOf(HTMLButtonElement);
    expect(document.body.textContent).not.toContain("View only");
    expect(
      document.querySelector('[data-slot="context-menu-trigger"]')
    ).not.toBeNull();
  });

  it("hides New page and context menus and shows the badge for viewers", () => {
    render("viewer");
    expect(newPageButton()).toBeNull();
    expect(document.body.textContent).toContain("View only");
    expect(
      document.querySelector('[data-slot="context-menu-trigger"]')
    ).toBeNull();
  });

  it("fails closed without a badge while the role is unknown", () => {
    render(null);
    expect(newPageButton()).toBeNull();
    expect(document.body.textContent).not.toContain("View only");
    expect(
      document.querySelector('[data-slot="context-menu-trigger"]')
    ).toBeNull();
  });
});

describe("DocumentTree optimistic rollback", () => {
  it("removes the optimistic root page when creation fails", async () => {
    createDocument.mockRejectedValue(new Error("Forbidden"));
    const { store } = render("editor");

    await submitNewRootPage();

    expect(createDocument).toHaveBeenCalledOnce();
    expect(store.documents.map((d) => d.id)).toEqual(["a", "b"]);
  });

  it("rolls back and shows a permission message when creation is denied", async () => {
    createDocument.mockResolvedValue({ ok: false, code: "FORBIDDEN" });
    const { store } = render("editor");

    await submitNewRootPage();

    expect(store.documents.map((d) => d.id)).toEqual(["a", "b"]);
    expect(errorMessages).toEqual([
      "You do not have permission to create pages.",
    ]);
  });

  it("keeps the generic message for non-permission failures", async () => {
    createDocument.mockRejectedValue(new Error("Failed to create document"));
    render("editor");

    await submitNewRootPage();

    expect(errorMessages).toEqual(["Could not create page."]);
  });

  it("keeps the optimistic root page when creation succeeds", async () => {
    createDocument.mockResolvedValue({ ok: true, data: undefined });
    const { store } = render("editor");

    await submitNewRootPage();

    expect(store.documents).toHaveLength(3);
  });

  it("restores only the trashed ids on failure, keeping concurrent changes", async () => {
    let reject!: (error: Error) => void;
    softDeleteDocumentTree.mockReturnValue(
      new Promise((_, r) => {
        reject = r;
      })
    );
    const { store } = render("editor", [doc("a"), doc("a1", "a"), doc("b")]);
    const inTrash = (id: string) =>
      store.documents.find((d) => d.id === id)?.inTrash;

    const trigger = document
      .getElementById("document-tree-item-a")!
      .closest('[data-slot="context-menu-trigger"]')!;
    act(() => {
      trigger.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 5,
          clientY: 5,
        })
      );
    });
    const item = [
      ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ].find((el) => el.textContent?.includes("Move to trash"));
    expect(item?.getAttribute("data-variant")).toBe("destructive");
    act(() => item?.click());

    expect(inTrash("a")).toBe(true);
    expect(inTrash("a1")).toBe(true);

    // A realtime change lands on an unrelated page while the call is in flight.
    act(() => {
      store.updateDocument({ ...doc("b"), title: "Renamed remotely" });
    });

    await act(async () => reject(new Error("fail")));
    await flush();

    expect(errorMessages).toEqual(["Could not move to trash."]);

    expect(inTrash("a")).toBe(false);
    expect(inTrash("a1")).toBe(false);
    expect(store.documents.find((d) => d.id === "b")?.title).toBe(
      "Renamed remotely"
    );
  });

  it("rolls back and shows a permission message when trashing is denied", async () => {
    softDeleteDocumentTree.mockResolvedValue({ ok: false, code: "FORBIDDEN" });
    const { store } = render("editor", [doc("a"), doc("a1", "a"), doc("b")]);

    const trigger = document
      .getElementById("document-tree-item-a")!
      .closest('[data-slot="context-menu-trigger"]')!;
    act(() => {
      trigger.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 5,
          clientY: 5,
        })
      );
    });
    const item = [
      ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ].find((el) => el.textContent?.includes("Move to trash"));
    await act(async () => item?.click());
    await flush();

    expect(store.documents.every((d) => !d.inTrash)).toBe(true);
    expect(errorMessages).toEqual([
      "You do not have permission to move this page to trash.",
    ]);
  });
});
