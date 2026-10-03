import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cache: vi.fn() }));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown, keys: string[], opts: unknown) => {
    mocks.cache(keys, opts);
    return fn;
  },
}));
vi.mock("..", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    selectDistinct: () => ({
      from: () => ({
        orderBy: () => ({
          innerJoin: () => ({ where: () => Promise.resolve([]) }),
        }),
      }),
    }),
  },
}));
vi.mock("../schema", () => ({ collaborators: {}, users: {}, workspaces: {} }));
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  notExists: vi.fn(),
}));

const { getPrivateWorkspaces, getSharedWorkspaces } =
  await import("./workspace-lists");
const { workspaceListTag } = await import("./workspace-list-tags");

describe("workspace list caches", () => {
  it("key and tag each list by user id", async () => {
    await getPrivateWorkspaces("u1");
    await getSharedWorkspaces("u2");

    expect(mocks.cache).toHaveBeenCalledWith(["get_private_workspaces", "u1"], {
      tags: [workspaceListTag("private", "u1")],
    });
    expect(mocks.cache).toHaveBeenCalledWith(["get_shared_workspaces", "u2"], {
      tags: [workspaceListTag("shared", "u2")],
    });
  });
});
