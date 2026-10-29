// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AppStateContext, createAppStore } from "@/hooks/use-app-state";
import { NewPageButton } from "./new-page-button";

const { createDocument, push, setOpen, errors } = vi.hoisted(() => ({
  createDocument: vi.fn(),
  push: vi.fn(),
  setOpen: vi.fn(),
  errors: [] as unknown[],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => window.location.pathname,
}));
vi.mock("@/components/realtime/workspace-realtime-provider", () => ({
  useNotifyWorkspacePageChanges: () => vi.fn(),
}));
vi.mock("@/components/subscription-modal-provider", () => ({
  useSubscriptionModal: () => ({ setOpen }),
}));
vi.mock("@/lib/db/actions/document", () => ({ createDocument }));
vi.mock("sonner", () => ({
  toast: {
    promise: (
      promise: Promise<unknown>,
      opts: {
        success: (data: unknown) => unknown;
        error: (e: unknown) => unknown;
      }
    ) =>
      promise.then(opts.success).catch((e) => {
        errors.push(opts.error(e));
      }),
  },
}));

async function mount(role: "owner" | "editor" = "owner") {
  const store = createAppStore({ user: null, documents: [], role });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const ui = (
    <AppStateContext.Provider value={store}>
      <NewPageButton workspaceId="ws-1" />
    </AppStateContext.Provider>
  );
  await act(async () => root.render(ui));
  return {
    store,
    click: () => act(async () => container.querySelector("button")!.click()),
  };
}

async function click(role: "owner" | "editor" = "owner") {
  const page = await mount(role);
  await page.click();
  return page.store;
}

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  history.replaceState({}, "", "/dashboard/ws-1");
  document.body.replaceChildren();
  errors.length = 0;
  vi.clearAllMocks();
});

describe("NewPageButton", () => {
  it("creates a root page and opens it", async () => {
    createDocument.mockResolvedValue({ ok: true, data: undefined });

    const store = await click();

    const [created] = store.documents;
    expect(created.parentId).toBeNull();
    expect(push).toHaveBeenCalledExactlyOnceWith(
      `/dashboard/ws-1/${created.id}`
    );
  });

  it("does not navigate if the user already went elsewhere", async () => {
    let finish!: () => void;
    createDocument.mockReturnValue(
      new Promise((resolve) => {
        finish = () => resolve({ ok: true, data: undefined });
      })
    );
    const page = await mount();
    await page.click();

    await act(async () => {
      history.replaceState({}, "", "/dashboard/ws-1/elsewhere");
    });
    await act(async () => finish());

    expect(push).not.toHaveBeenCalled();
  });

  it("shows the owner-upgrade message to non-owners at the quota", async () => {
    createDocument.mockResolvedValue({
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: "Upgrade.",
    });

    await click("editor");

    expect(errors).toEqual(["Ask the workspace owner to upgrade to Pro."]);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("rolls back and opens the upgrade modal for the owner at the quota", async () => {
    createDocument.mockResolvedValue({
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: "Upgrade.",
    });

    const store = await click();

    expect(store.documents).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
    expect(setOpen).toHaveBeenCalledExactlyOnceWith(true);
  });
});
