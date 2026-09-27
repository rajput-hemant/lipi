import postgres from "postgres";

import { E2E_DATABASE_URL } from "../env";

export async function getWorkspaceInviteToken(email: string) {
  const sql = postgres(E2E_DATABASE_URL, { max: 1 });
  try {
    const rows = await sql<{ token: string }[]>`
      select token
      from lipi_workspace_invites
      where lower(email) = lower(${email})
      order by created_at desc
      limit 1
    `;
    const token = rows[0]?.token;
    if (!token) throw new Error(`No invite token for ${email}`);
    return token;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
