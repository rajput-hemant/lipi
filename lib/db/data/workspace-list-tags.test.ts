import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ revalidateTag: vi.fn() }));

vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("..", () => ({ db: {} }));
vi.mock("../schema", () => ({ collaborators: {}, workspaces: {} }));

const { revalidateWorkspaceLists, workspaceListTag } =
  await import("./workspace-list-tags");

beforeEach(() => vi.clearAllMocks());

describe("workspace list tags", () => {
  it("includes the user id so lists are invalidated per user", () => {
    expect(workspaceListTag("private", "u1")).not.toBe(
      workspaceListTag("private", "u2")
    );
    expect(workspaceListTag("shared", "u1")).toContain("u1");
  });

  it("revalidates all three lists once per distinct user and skips empty ids", () => {
    revalidateWorkspaceLists(["u1", "u2", "u1", undefined]);

    const tags = mocks.revalidateTag.mock.calls.map(([tag]) => tag);
    expect(tags).toHaveLength(6);
    expect(new Set(tags)).toEqual(
      new Set(
        ["u1", "u2"].flatMap((id) =>
          (["private", "collaborating", "shared"] as const).map((kind) =>
            workspaceListTag(kind, id)
          )
        )
      )
    );
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      workspaceListTag("private", "u1"),
      "max"
    );
  });
});
