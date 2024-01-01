export type DBResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export * from "./workspace";
export * from "./folder";
export * from "./subscription";
