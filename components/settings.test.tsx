// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AppStateContext, createAppStore } from "@/hooks/use-app-state";
import { Settings } from "./settings";

const mocks = vi.hoisted(() => ({
  listWorkspaceMembers: vi.fn(),
  createWorkspaceCollaboratorInvite: vi.fn(),
  updateCollaboratorRole: vi.fn(),
  removeWorkspaceMember: vi.fn(),
  transferWorkspaceOwnership: vi.fn(),
  deleteWorkspace: vi.fn(),
  updateWorkspaceSettings: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => mocks);
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/ws-1",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/emoji-picker", () => ({
  EmojiPicker: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/uploadthing", () => ({ uploadFiles: vi.fn() }));
vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((pending: Promise<unknown>) => void pending.catch(() => {})),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const payload = {
  workspace: { id: "ws-1", title: "Team", iconId: "x", logo: null },
  currentRole: "owner",
  owner: { id: "o", email: "owner@example.com", name: "Owner", image: null },
  members: [
    {
      id: "c1",
      role: "editor",
      userId: "u1",
      email: "m@example.com",
      name: "Member",
      image: null,
    },
  ],
  pendingInvites: [],
};

const denied = {
  ok: false,
  code: "FORBIDDEN",
  message: "You do not have permission to do that.",
};
const quota = {
  ok: false,
  code: "INVALID",
  message: "Free plan allows two collaborators.",
};

const ok = { ok: true, data: {} };

function render() {
  const store = createAppStore({ user: null, documents: [], role: "owner" });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <AppStateContext.Provider value={store}>
        <Settings />
      </AppStateContext.Provider>
    );
  });
  return root;
}

const button = (text: string) =>
  [...document.querySelectorAll<HTMLElement>("button, [role=menuitem]")].find(
    (b) => b.textContent?.trim() === text
  )!;

async function click(element: HTMLElement) {
  await act(async () => element.click());
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** The message the latest toast.promise would show for its rejection. */
async function errorMessage() {
  const [promise, options] = vi.mocked(toast.promise).mock.lastCall as [
    Promise<unknown>,
    { error: (error: unknown) => string },
  ];
  const error = await promise.catch((e: unknown) => e);
  return options.error(error);
}

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(async () => {
  mocks.listWorkspaceMembers.mockResolvedValue(payload);
  for (const action of [
    mocks.updateWorkspaceSettings,
    mocks.createWorkspaceCollaboratorInvite,
    mocks.updateCollaboratorRole,
    mocks.removeWorkspaceMember,
    mocks.transferWorkspaceOwnership,
    mocks.deleteWorkspace,
  ]) {
    action.mockResolvedValue(denied);
  }
  await act(async () => {
    render();
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("Settings mutation failures", () => {
  it("shows the permission message when saving is denied", async () => {
    await click(button("Save changes"));
    expect(mocks.updateWorkspaceSettings).toHaveBeenCalled();
    expect(await errorMessage()).toBe(denied.message);
  });

  it("shows the collaborator quota message when inviting", async () => {
    mocks.createWorkspaceCollaboratorInvite.mockResolvedValue(quota);
    const email = document.querySelector<HTMLInputElement>(
      'input[placeholder="name@example.com"]'
    )!;
    await act(async () => type(email, "new@example.com"));
    await click(button("Invite"));

    expect(mocks.createWorkspaceCollaboratorInvite).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      email: "new@example.com",
      role: "editor",
    });
    expect(await errorMessage()).toBe(quota.message);
  });

  it("shows the server message when changing a role fails", async () => {
    await click(button("editor"));
    await click(button("Viewer"));

    expect(mocks.updateCollaboratorRole).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      collaboratorId: "c1",
      role: "viewer",
    });
    expect(await errorMessage()).toBe(denied.message);
  });

  it("shows the server message when removing a member fails", async () => {
    mocks.removeWorkspaceMember.mockResolvedValue({
      ...quota,
      message: "Collaborator not found",
    });
    await click(button("editor"));
    await click(button("Remove"));

    expect(mocks.removeWorkspaceMember).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      collaboratorId: "c1",
    });
    expect(await errorMessage()).toBe("Collaborator not found");
  });

  it("shows the server message when transferring ownership fails", async () => {
    const select =
      document.querySelector<HTMLSelectElement>("#transfer-member")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "value"
      )!.set!.call(select, "u1");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await click(button("Transfer ownership"));

    expect(mocks.transferWorkspaceOwnership).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      newOwnerUserId: "u1",
    });
    expect(await errorMessage()).toBe(denied.message);
  });

  it("shows the server message when deleting the workspace fails", async () => {
    await click(button("Delete workspace"));
    const confirm = [
      ...document.querySelectorAll<HTMLElement>("button"),
    ].findLast((b) => b.textContent === "Delete workspace")!;
    await click(confirm);

    expect(mocks.deleteWorkspace).toHaveBeenCalledWith({
      workspaceId: "ws-1",
    });
    expect(await errorMessage()).toBe(denied.message);
  });

  it("falls back to a generic message for unexpected errors", async () => {
    mocks.deleteWorkspace.mockRejectedValue(new Error("stripped"));
    await click(button("Delete workspace"));
    const confirm = [
      ...document.querySelectorAll<HTMLElement>("button"),
    ].findLast((b) => b.textContent === "Delete workspace")!;
    await click(confirm);

    expect(await errorMessage()).toBe("Failed to delete workspace");
  });

  it("reports success without an error toast", async () => {
    mocks.updateCollaboratorRole.mockResolvedValue(ok);
    await click(button("editor"));
    await click(button("Viewer"));

    const [promise] = vi.mocked(toast.promise).mock.lastCall as [
      Promise<unknown>,
    ];
    await expect(promise).resolves.toEqual({});
  });
});
