export type DBResponse<T> =
  { data: T; error: null } | { data: null; error: string };

// NOTE:
// avoid star export, causing warning
// ```The requested module '...' contains conflicting star exports for the name '$$ACTION_0' with the previous requested module '...'```

export { createWorkspace, listWorkspacesForCurrentUser } from "./workspace";
export {
  getCollaboratingWorkspaces,
  getDefaultWorkspaceId,
  getPrivateWorkspaces,
  getSharedWorkspaces,
  listWorkspacesForSwitcher,
} from "./workspace-lists";
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
  getDocumentsFromDb,
  restoreDocument,
  softDeleteDocumentTree,
  updateDocument,
  updateDocumentInDb,
} from "./document";
export {
  searchDocumentsInWorkspace,
  type SearchDocumentResult,
} from "./search";
