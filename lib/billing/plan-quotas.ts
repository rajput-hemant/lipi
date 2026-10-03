export const FREE_PLAN_MAX_WORKSPACES = 1;
export const FREE_PLAN_MAX_COLLABORATORS = 2;
export const FREE_PLAN_MAX_BLOCKS = 500;

export function canCreateWorkspace(params: {
  isPro: boolean;
  ownedWorkspaceCount: number;
}): boolean {
  if (params.isPro) return true;
  return params.ownedWorkspaceCount < FREE_PLAN_MAX_WORKSPACES;
}

export function canAddCollaborator(params: {
  isPro: boolean;
  collaboratorCount: number;
}): boolean {
  if (params.isPro) return true;
  return params.collaboratorCount < FREE_PLAN_MAX_COLLABORATORS;
}

/** Whether an owner may end up with `collaboratorCount` collaborators in total. */
export function canHoldCollaborators(params: {
  isPro: boolean;
  collaboratorCount: number;
}): boolean {
  if (params.isPro) return true;
  return params.collaboratorCount <= FREE_PLAN_MAX_COLLABORATORS;
}

export function canCreateBlock(params: {
  isPro: boolean;
  blockCount: number;
}): boolean {
  if (params.isPro) return true;
  return params.blockCount < FREE_PLAN_MAX_BLOCKS;
}
