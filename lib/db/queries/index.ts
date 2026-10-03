export type DBResponse<T> =
  { data: T; error: null } | { data: null; error: string };

// NOTE: `workspace-lists` is intentionally not re-exported. It has no "use server"
// directive, so exporting it here would pull the database driver into every client
// bundle that imports this barrel. Import it directly from server code.
//
// NOTE:
// avoid star export, causing warning
// ```The requested module '...' contains conflicting star exports for the name '$$ACTION_0' with the previous requested module '...'```

export { createWorkspace, listWorkspacesForCurrentUser } from "./workspace";
export {
  acceptWorkspaceInvite,
  createWorkspaceCollaboratorInvite,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateCollaboratorRole,
} from "./workspace-members";
export {
  deleteWorkspace,
  transferWorkspaceOwnership,
  updateWorkspaceSettings,
} from "./workspace-settings";
export {
  createDocument,
  deleteDocumentPermanently,
  duplicateDocument,
  getDocumentBreadcrumbs,
  getDocuments,
  restoreDocument,
  softDeleteDocumentTree,
  updateDocument,
} from "./document";
export {
  searchDocumentsInWorkspace,
  type SearchDocumentResult,
} from "./search";
