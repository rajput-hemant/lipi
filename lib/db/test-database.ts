import postgres from "postgres";

import { isLoopbackDatabaseUrl } from "./database-url";

/**
 * Loopback database named by TEST_DATABASE_URL that already has the Lipi
 * schema (`bun run db:setup`), or null so DB-backed suites skip themselves.
 */
export async function resolveTestDatabaseUrl(): Promise<string | null> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !isLoopbackDatabaseUrl(url)) return null;

  const client = postgres(url, { max: 1, connect_timeout: 3 });
  try {
    await client`select 1 from lipi_documents limit 0`;
    return url;
  } catch {
    return null;
  } finally {
    await client.end({ timeout: 1 });
  }
}

export function createTestClient(url: string) {
  return postgres(url, { max: 1, onnotice: () => {} });
}

type TestClient = ReturnType<typeof createTestClient>;

/** Inserts rows with random ids and removes everything they own on cleanup. */
export function createTestFixtures(sql: TestClient) {
  const userIds: string[] = [];
  const workspaceIds: string[] = [];

  return {
    async user(label = "user") {
      const id = crypto.randomUUID();
      userIds.push(id);
      await sql`insert into "user" (id, email) values (${id}, ${`${label}-${id}@example.test`})`;
      return id;
    },
    async workspace(ownerId: string, options: { inTrash?: boolean } = {}) {
      const id = crypto.randomUUID();
      workspaceIds.push(id);
      await sql`
        insert into lipi_workspaces (id, title, icon_id, workspace_owner_id, in_trash)
        values (${id}, 'Test workspace', '', ${ownerId}, ${options.inTrash ?? false})`;
      return id;
    },
    async collaborator(workspaceId: string, userId: string, role = "editor") {
      await sql`
        insert into lipi_collaborators (workspace_id, user_id, role)
        values (${workspaceId}, ${userId}, ${role}::workspace_collaborator_role)`;
    },
    async invite(
      workspaceId: string,
      invitedBy: string,
      email: string,
      expiresAt: Date
    ) {
      await sql`
        insert into lipi_workspace_invites (workspace_id, email, token, invited_by_user_id, expires_at)
        values (${workspaceId}, ${email}, ${crypto.randomUUID()}, ${invitedBy}, ${expiresAt.toISOString()})`;
    },
    async document(
      workspaceId: string,
      values: {
        id?: string;
        title?: string;
        parentId?: string | null;
        content?: string | null;
        inTrash?: boolean;
        updatedAt?: Date;
        createdAt?: Date;
      } = {}
    ) {
      const id = values.id ?? crypto.randomUUID();
      const stamp = (values.updatedAt ?? new Date()).toISOString();
      const created = (
        values.createdAt ??
        values.updatedAt ??
        new Date()
      ).toISOString();
      await sql`
        insert into lipi_documents (id, workspace_id, parent_id, title, content, in_trash, created_at, updated_at)
        values (${id}, ${workspaceId}, ${values.parentId ?? null}, ${values.title ?? "Untitled"},
          ${values.content ?? null}, ${values.inTrash ?? false}, ${created}, ${stamp})`;
      return id;
    },
    async subscription(userId: string, priceId: string, status = "active") {
      await sql`
        insert into lipi_subscriptions (id, user_id, status, price_id)
        values (${crypto.randomUUID()}, ${userId}, ${status}::subscription_status, ${priceId})`;
    },
    async cleanup() {
      if (workspaceIds.length) {
        await sql`update lipi_documents set parent_id = null where workspace_id in ${sql(workspaceIds)}`;
        await sql`delete from lipi_workspaces where id in ${sql(workspaceIds)}`;
      }
      if (userIds.length) {
        await sql`delete from lipi_subscriptions where user_id in ${sql(userIds)}`;
        await sql`delete from lipi_workspaces where workspace_owner_id in ${sql(userIds)}`;
        await sql`delete from "user" where id in ${sql(userIds)}`;
      }
    },
  };
}
