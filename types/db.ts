import type {
  billingAccounts,
  collaborators,
  customers,
  documents,
  prices,
  products,
  subscriptions,
  users,
  workspaces,
} from "@/lib/db/schema";

export type User = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferInsert;
export type Document = typeof documents.$inferSelect;
/** Every document column except `content`; editor bodies come from Yjs. */
export type DocumentSummary = Omit<Document, "content">;
export type NewDocument = typeof documents.$inferInsert;
export type Account = typeof billingAccounts.$inferInsert;
export type Customer = typeof customers.$inferInsert;
export type Product = typeof products.$inferInsert;
export type Collaborator = typeof collaborators.$inferInsert;
export type Price = typeof prices.$inferInsert & { products: Product[] };
export type Subscription = typeof subscriptions.$inferInsert;
