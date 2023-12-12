import type { InferInsertModel } from "drizzle-orm";

import type {
  accounts,
  collaborators,
  customers,
  files,
  folders,
  prices,
  products,
  subscriptions,
  workspaces,
} from "@/lib/db/schema";

export type Workspace = InferInsertModel<typeof workspaces>;
export type Folder = InferInsertModel<typeof folders>;
export type File = InferInsertModel<typeof files>;
export type Account = InferInsertModel<typeof accounts>;
export type Customer = InferInsertModel<typeof customers>;
export type Product = InferInsertModel<typeof products>;
export type Collaborator = InferInsertModel<typeof collaborators>;
export type Price = InferInsertModel<typeof prices> & { products: Product[] };
export type Subscription = InferInsertModel<typeof subscriptions> & {
  prices: Price[];
};
