import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionStatus = pgEnum("subscription_status", [
  "unpaid",
  "past_due",
  "incomplete_expired",
  "incomplete",
  "canceled",
  "active",
  "trialing",
]);

export const workspaceCollaboratorRole = pgEnum("workspace_collaborator_role", [
  "editor",
  "viewer",
]);
