"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { resolveAuthBaseURL } from "@/lib/auth/resolve-auth-base-url";
import { hasWorkspacePermission } from "@/lib/workspace/permissions";
import { sendWorkspaceInviteEmail } from "@/lib/workspace/send-invite";
import { publicPendingInvitesForRole } from "@/lib/workspace/workspace-invites";
import { db } from "..";
import {
  authorizeWorkspaceMemberManagement,
  getWorkspaceMembershipRole,
  MutationAuthError,
  requireAuthenticatedUser,
  requireWorkspacePermission,
} from "../data/mutation-auth";
import { runMutation } from "../data/mutation-failure";
import {
  getWorkspaceOwnerId,
  revalidateWorkspaceLists,
} from "../data/workspace-list-tags";
import { ensureOwnerCollaboratorQuota } from "../data/workspace-member-quota";
import { collaborators, users, workspaceInvites, workspaces } from "../schema";

const inviteRoleSchema = z.enum(["editor", "viewer"]);

const inviteMemberSchema = z.object({
  workspaceId: z.uuid(),
  email: z.email(),
  role: inviteRoleSchema,
});

const updateMemberRoleSchema = z.object({
  workspaceId: z.uuid(),
  collaboratorId: z.uuid(),
  role: inviteRoleSchema,
});

const removeMemberSchema = z.object({
  workspaceId: z.uuid(),
  collaboratorId: z.uuid(),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function listWorkspaceMembers(workspaceId: string) {
  const user = await requireAuthenticatedUser();
  await requireWorkspacePermission(user.id, workspaceId, "workspace:read");

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    throw new MutationAuthError("Workspace not found");
  }

  const owner = await db.query.users.findFirst({
    where: eq(users.id, workspace.workspaceOwnerId),
    columns: { id: true, email: true, name: true, image: true },
  });

  const memberRows = await db
    .select({
      id: collaborators.id,
      role: collaborators.role,
      userId: collaborators.userId,
      email: users.email,
      name: users.name,
      image: users.image,
    })
    .from(collaborators)
    .innerJoin(users, eq(collaborators.userId, users.id))
    .where(eq(collaborators.workspaceId, workspaceId));

  const { role: currentRole } = await getWorkspaceMembershipRole(
    user.id,
    workspaceId
  );

  const inviteRows =
    hasWorkspacePermission(currentRole, "member:manage") ?
      await db
        .select({
          id: workspaceInvites.id,
          email: workspaceInvites.email,
          role: workspaceInvites.role,
          token: workspaceInvites.token,
          expiresAt: workspaceInvites.expiresAt,
        })
        .from(workspaceInvites)
        .where(eq(workspaceInvites.workspaceId, workspaceId))
    : [];

  const pendingInvites = publicPendingInvitesForRole(currentRole, inviteRows);

  return {
    workspace,
    currentRole,
    owner,
    members: memberRows,
    pendingInvites,
  };
}

export async function createWorkspaceCollaboratorInvite(input: unknown) {
  const parsed = inviteMemberSchema.parse(input);
  return runMutation(async () => {
    const user = await authorizeWorkspaceMemberManagement(parsed.workspaceId);
    const email = normalizeEmail(parsed.email);

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, parsed.workspaceId),
    });

    if (!workspace) {
      throw new MutationAuthError("Workspace not found");
    }

    const owner = await db.query.users.findFirst({
      where: eq(users.id, workspace.workspaceOwnerId),
      columns: { email: true },
    });

    if (owner?.email && normalizeEmail(owner.email) === email) {
      throw new MutationAuthError("The workspace owner is already a member");
    }

    const existingMember = await db
      .select({ id: collaborators.id })
      .from(collaborators)
      .innerJoin(users, eq(collaborators.userId, users.id))
      .where(
        and(
          eq(collaborators.workspaceId, parsed.workspaceId),
          eq(users.email, email)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      throw new MutationAuthError("This user is already a collaborator");
    }

    await ensureOwnerCollaboratorQuota(workspace.workspaceOwnerId, {
      workspaceId: parsed.workspaceId,
      email,
    });

    const token = randomUUID();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    await db
      .insert(workspaceInvites)
      .values({
        workspaceId: parsed.workspaceId,
        email,
        role: parsed.role,
        token,
        invitedByUserId: user.id,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [workspaceInvites.workspaceId, workspaceInvites.email],
        set: {
          role: parsed.role,
          token,
          invitedByUserId: user.id,
          expiresAt,
        },
      });

    const baseUrl = resolveAuthBaseURL();
    const acceptUrl = `${baseUrl}/invite/${token}`;

    await sendWorkspaceInviteEmail({
      to: email,
      workspaceTitle: workspace.title,
      acceptUrl,
    });

    revalidateWorkspaceLists([workspace.workspaceOwnerId]);

    return { token, acceptUrl };
  });
}

export async function updateCollaboratorRole(input: unknown) {
  const parsed = updateMemberRoleSchema.parse(input);
  return runMutation(async () => {
    await authorizeWorkspaceMemberManagement(parsed.workspaceId);

    const [updated] = await db
      .update(collaborators)
      .set({ role: parsed.role })
      .where(
        and(
          eq(collaborators.id, parsed.collaboratorId),
          eq(collaborators.workspaceId, parsed.workspaceId)
        )
      )
      .returning();

    if (!updated) {
      throw new MutationAuthError("Collaborator not found");
    }

    revalidateWorkspaceLists([
      updated.userId,
      await getWorkspaceOwnerId(parsed.workspaceId),
    ]);
    return updated;
  });
}

export async function removeWorkspaceMember(input: unknown) {
  const parsed = removeMemberSchema.parse(input);
  return runMutation(async () => {
    await authorizeWorkspaceMemberManagement(parsed.workspaceId);

    const [removed] = await db
      .delete(collaborators)
      .where(
        and(
          eq(collaborators.id, parsed.collaboratorId),
          eq(collaborators.workspaceId, parsed.workspaceId)
        )
      )
      .returning();

    if (!removed) {
      throw new MutationAuthError("Collaborator not found");
    }

    revalidateWorkspaceLists([
      removed.userId,
      await getWorkspaceOwnerId(parsed.workspaceId),
    ]);
    return removed;
  });
}

export async function acceptWorkspaceInvite(token: string) {
  const user = await requireAuthenticatedUser();
  const invite = await db.query.workspaceInvites.findFirst({
    where: eq(workspaceInvites.token, token),
  });

  if (!invite) {
    throw new MutationAuthError("Invite not found");
  }

  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    throw new MutationAuthError("Invite expired");
  }

  const account = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { email: true },
  });

  if (!account?.email || normalizeEmail(account.email) !== invite.email) {
    throw new MutationAuthError(
      "Sign in with the email address that received this invite"
    );
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, invite.workspaceId),
  });

  if (!workspace) {
    throw new MutationAuthError("Workspace not found");
  }

  const existing = await db.query.collaborators.findFirst({
    where: and(
      eq(collaborators.workspaceId, invite.workspaceId),
      eq(collaborators.userId, user.id)
    ),
  });

  if (!existing) {
    await ensureOwnerCollaboratorQuota(workspace.workspaceOwnerId);

    await db.insert(collaborators).values({
      workspaceId: invite.workspaceId,
      userId: user.id,
      role: invite.role,
    });
  }

  await db.delete(workspaceInvites).where(eq(workspaceInvites.id, invite.id));

  revalidateWorkspaceLists([user.id, workspace.workspaceOwnerId]);

  return { workspaceId: invite.workspaceId };
}
