import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createTestClient,
  createTestFixtures,
  resolveTestDatabaseUrl,
} from "@/lib/db/test-database";

const testDatabaseUrl = await resolveTestDatabaseUrl();

const mocks = vi.hoisted(() => ({
  currentUser: null as { id: string } | null,
  requestMemo: new Map<Function, Map<string, unknown>>(),
}));

// Outside a React render `cache` does not memoize, so this stands in for the
// per-request dispatcher: it proves the wrapped functions run real SQL once per
// distinct argument list, not that Next scopes the memo to a request.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache:
    (fn: Function) =>
    (...args: unknown[]) => {
      let calls = mocks.requestMemo.get(fn);
      if (!calls) mocks.requestMemo.set(fn, (calls = new Map()));
      const key = JSON.stringify(args);
      if (!calls.has(key)) calls.set(key, fn(...args));
      return calls.get(key);
    },
}));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => mocks.currentUser,
}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

describe.skipIf(!testDatabaseUrl)(
  "request-scoped reads against Postgres",
  () => {
    const sql = createTestClient(testDatabaseUrl!);
    const fixtures = createTestFixtures(sql);
    let db: typeof import("@/lib/db").db;
    let request: typeof import("@/lib/dashboard/workspace-request");
    let owner: string;
    let workspace: string;

    beforeAll(async () => {
      process.env.DATABASE_URL = testDatabaseUrl!;
      ({ db } = await import("@/lib/db"));
      request = await import("@/lib/dashboard/workspace-request");
    });

    afterAll(async () => {
      await fixtures.cleanup();
      await sql.end({ timeout: 1 });
      await (db.$client as { end: () => Promise<void> }).end();
    });

    beforeEach(async () => {
      vi.restoreAllMocks();
      mocks.requestMemo.clear();
      owner = await fixtures.user("owner");
      workspace = await fixtures.workspace(owner);
      mocks.currentUser = { id: owner };
    });

    it("resolves the owner and a collaborator role with one workspace query per call site", async () => {
      const editor = await fixtures.user("editor");
      await fixtures.collaborator(workspace, editor, "editor");
      const workspaceQuery = vi.spyOn(db.query.workspaces, "findFirst");

      const first = await request.getRequestMembership(owner, workspace);
      const second = await request.getRequestMembership(owner, workspace);
      const member = await request.getRequestMembership(editor, workspace);

      expect(first.role).toBe("owner");
      expect(second).toBe(first);
      expect(member.role).toBe("editor");
      expect(workspaceQuery).toHaveBeenCalledTimes(2);
    });

    it("rejects a non-member and an unknown workspace", async () => {
      const stranger = await fixtures.user("stranger");

      await expect(
        request.getRequestMembership(stranger, workspace)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        request.getRequestMembership(crypto.randomUUID(), crypto.randomUUID())
      ).rejects.toThrow("Workspace not found");
    });

    it("loads the workspace documents once for repeated calls in a request", async () => {
      const id = await fixtures.document(workspace, { title: "Only" });
      const select = vi.spyOn(db, "select");

      const first = await request.getRequestDocuments(workspace);
      const second = await request.getRequestDocuments(workspace);

      expect(first.map((row) => row.id)).toEqual([id]);
      expect(second).toBe(first);
      expect(select).toHaveBeenCalledTimes(1);
    });

    it("does not serve documents to a non-member even after the owner loaded them", async () => {
      await fixtures.document(workspace);
      await request.getRequestDocuments(workspace);

      mocks.requestMemo.clear();
      mocks.currentUser = { id: await fixtures.user("stranger") };

      await expect(
        request.getRequestDocuments(workspace)
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  }
);
