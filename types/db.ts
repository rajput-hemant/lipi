import type { documents, subscriptions, workspaces } from "@/lib/db/schema";

export type Workspace = typeof workspaces.$inferInsert;
export type Document = typeof documents.$inferSelect;
/** Every document column except `content`; editor bodies come from Yjs. */
export type DocumentSummary = Omit<Document, "content">;
export type Subscription = typeof subscriptions.$inferInsert;
