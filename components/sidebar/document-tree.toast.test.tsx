// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { WorkspaceRecord } from "@/hooks/use-app-state";
import type { DocumentSummary } from "@/types/db";

import { AppStateContext, createAppStore } from "@/hooks/use-app-state";
import { SidebarProvider } from "../ui/sidebar";
import { TooltipProvider } from "../ui/tooltip";
import { DocumentTree } from "./document-tree";

const {
  createDocument,
  duplicateDocument,
  softDeleteDocumentTree,
  errorMessages,
  pendingPromises,
  setModalOpen,
  roots,
  proEntitlement,
} = vi.hoisted(() => ({
  createDocument: vi.fn(),
  duplicateDocument: vi.fn(),
  softDeleteDocumentTree: vi.fn(),
  errorMessages: [] as unknown[],
  pendingPromises: [] as Promise<unknown>[],
  setModalOpen: vi.fn(),
  roots: [] as { unmount: () => void }[],
  proEntitlement: { value: true },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/ws-1",
}));
vi.mock("@/components/realtime/workspace-realtime-provider", () => ({
  useNotifyWorkspacePageChanges: () => vi.fn(),
}));
vi.mock("../subscription-modal-provider", () => ({
  useSubscriptionModal: () => ({
    setOpen: setModalOpen,
    hasProEntitlement: proEntitlement.value,
  }),
}));
vi.mock("@/lib/db/actions/document", () => ({
  createDocument,
  duplicateDocument,
  softDeleteDocumentTree,
  updateDocument: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: (
      promise: Promise<unknown>,
      opts: { error: (e: unknown) => unknown }
    ) => {
      const p = Promise.resolve(promise).catch((e) => {
        errorMessages.push(opts.error(e));
      });
      pendingPromises.push(p);
      return p;
    },
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
  documents = [doc("a"), doc("b")],
  role: "owner" | "editor" = "editor"
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
  roots.push(root);
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
  return store;
}

const flush = async () => {
  await act(async () => {
    while (pendingPromises.length > 0) {
      await pendingPromises.shift();
    }
  });
};

function openMenuItem(label: string) {
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
  return [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
    (el) => el.textContent?.includes(label)
  )!;
}

async function submitForm() {
  await act(async () => {
    document
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await flush();
}

const ids = (store: ReturnType<typeof render>) =>
  store.documents.map((d) => d.id);

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  errorMessages.length = 0;
  proEntitlement.value = true;
  pendingPromises.length = 0;
  act(() => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("create child page toasts", () => {
  async function createChild() {
    const item = openMenuItem("New subpage");
    act(() => item.click());
    await submitForm();
  }

  it("rolls back the optimistic child and shows the denied message", async () => {
    createDocument.mockResolvedValue({ ok: false, code: "FORBIDDEN" });
    const store = render();

    await createChild();

    expect(createDocument).toHaveBeenCalledOnce();
    expect(ids(store)).toEqual(["a", "b"]);
    expect(errorMessages).toEqual([
      "You do not have permission to create pages.",
    ]);
  });

  it("rolls back the optimistic child and shows the failed message", async () => {
    createDocument.mockRejectedValue(new Error("boom"));
    const store = render();

    await createChild();

    expect(ids(store)).toEqual(["a", "b"]);
    expect(errorMessages).toEqual(["Could not create page."]);
  });
});

describe("duplicate page toasts", () => {
  async function duplicate() {
    const item = openMenuItem("Duplicate");
    await act(async () => item.click());
    await flush();
  }

  it("removes every optimistic copy and shows the denied message", async () => {
    duplicateDocument.mockResolvedValue({ ok: false, code: "FORBIDDEN" });
    const store = render([doc("a"), doc("a1", "a"), doc("b")]);

    await duplicate();

    expect(duplicateDocument).toHaveBeenCalledOnce();
    expect(ids(store)).toEqual(["a", "a1", "b"]);
    expect(errorMessages).toEqual([
      "You do not have permission to duplicate this page.",
    ]);
  });

  it("removes every optimistic copy and shows the failed message", async () => {
    duplicateDocument.mockRejectedValue(new Error("boom"));
    const store = render([doc("a"), doc("a1", "a"), doc("b")]);

    await duplicate();

    expect(ids(store)).toEqual(["a", "a1", "b"]);
    expect(errorMessages).toEqual(["Could not duplicate page."]);
  });
});

describe("trash and root quota toasts", () => {
  it("shows the server message for an invalid trash request and restores the page", async () => {
    softDeleteDocumentTree.mockResolvedValue({
      ok: false,
      code: "INVALID",
      message: "Document not found",
    });
    const trashedChild = { ...doc("a2", "a"), inTrash: true };
    const store = render([doc("a"), doc("a1", "a"), trashedChild, doc("b")]);
    const flags = () =>
      Object.fromEntries(store.documents.map((d) => [d.id, d.inTrash]));
    const original = flags();

    const item = openMenuItem("Move to trash");
    await act(async () => item.click());
    await flush();

    expect(flags()).toEqual({ a: false, a1: false, a2: true, b: false });
    expect(flags()).toEqual(original);
    expect(errorMessages).toEqual(["Document not found"]);
  });

  it("shows the server message, rolls back and opens the upgrade modal for the owner when the root page limit is reached", async () => {
    createDocument.mockResolvedValue({
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: "Upgrade for root pages.",
    });
    const store = render([doc("a"), doc("b")], "owner");

    act(() =>
      document
        .querySelector<HTMLButtonElement>('button[aria-label="New page"]')!
        .click()
    );
    await submitForm();

    expect(ids(store)).toEqual(["a", "b"]);
    expect(errorMessages).toEqual(["Upgrade for root pages."]);
    expect(setModalOpen).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("tells a non-owner to ask the owner and leaves the upgrade modal closed on a server quota failure", async () => {
    createDocument.mockResolvedValue({
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: "Upgrade for root pages.",
    });
    const store = render([doc("a"), doc("b")], "editor");

    act(() =>
      document
        .querySelector<HTMLButtonElement>('button[aria-label="New page"]')!
        .click()
    );
    await submitForm();

    expect(ids(store)).toEqual(["a", "b"]);
    expect(toast.info).toHaveBeenCalledExactlyOnceWith(
      "Ask the workspace owner to upgrade to Pro."
    );
    expect(setModalOpen).not.toHaveBeenCalled();
  });

  it("opens the upgrade modal for the owner at the client limit", () => {
    proEntitlement.value = false;
    render([doc("a"), doc("b"), doc("c")], "owner");

    act(() =>
      document
        .querySelector<HTMLButtonElement>('button[aria-label="New page"]')!
        .click()
    );

    expect(setModalOpen).toHaveBeenCalledExactlyOnceWith(true);
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("tells a non-owner to ask the owner and leaves the upgrade modal closed at the client limit", () => {
    proEntitlement.value = false;
    render([doc("a"), doc("b"), doc("c")], "editor");

    act(() =>
      document
        .querySelector<HTMLButtonElement>('button[aria-label="New page"]')!
        .click()
    );

    expect(toast.info).toHaveBeenCalledExactlyOnceWith(
      "Ask the workspace owner to upgrade to Pro."
    );
    expect(setModalOpen).not.toHaveBeenCalled();
  });

  it("does not open the upgrade modal for other root page failures", async () => {
    createDocument.mockResolvedValue({
      ok: false,
      code: "INVALID",
      message: "Document not found",
    });
    render();

    act(() =>
      document
        .querySelector<HTMLButtonElement>('button[aria-label="New page"]')!
        .click()
    );
    await submitForm();

    expect(setModalOpen).not.toHaveBeenCalled();
  });
});
