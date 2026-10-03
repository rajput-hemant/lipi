// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { WorkspaceForm } from "./workspace-form";

const { createWorkspace, replace } = vi.hoisted(() => ({
  createWorkspace: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/lib/db/actions/workspace", () => ({ createWorkspace }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/emoji-picker", () => ({
  EmojiPicker: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/subscription-modal-provider", () => ({
  useSubscriptionModal: () => ({ hasProEntitlement: false }),
}));
vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((pending: Promise<unknown>) => void pending.catch(() => {})),
  },
}));

async function submit(name: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<WorkspaceForm />);
  });

  const input = container.querySelector<HTMLInputElement>("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )!.set!.call(input, name);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => container.querySelector("button")!.click());
}

async function handlers() {
  const [promise, options] = vi.mocked(toast.promise).mock.lastCall as [
    Promise<unknown>,
    {
      success: (data: unknown) => string;
      error: (error: unknown) => string;
    },
  ];
  return {
    result: await promise.then(
      (v) => v,
      (e: unknown) => e
    ),
    options,
  };
}

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("WorkspaceForm", () => {
  it("shows the plan quota message when creation is refused", async () => {
    createWorkspace.mockResolvedValue({
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: "Free plan allows one workspace.",
    });
    await submit("Team");

    expect(createWorkspace).toHaveBeenCalledWith({
      title: "Team",
      iconId: "💼",
    });
    const { result, options } = await handlers();
    expect(options.error(result)).toBe("Free plan allows one workspace.");
    expect(replace).not.toHaveBeenCalled();
  });

  it("falls back to a generic message for unexpected errors", async () => {
    createWorkspace.mockRejectedValue(new Error("stripped"));
    await submit("Team");

    const { result, options } = await handlers();
    expect(options.error(result)).toBe("Failed to create workspace.");
  });

  it("opens the new workspace on success", async () => {
    createWorkspace.mockResolvedValue({ ok: true, data: { id: "w1" } });
    await submit("Team");

    const { result, options } = await handlers();
    expect(result).toEqual({ id: "w1" });
    options.success(result);
    expect(replace).toHaveBeenCalledWith("/dashboard/w1");
  });
});
