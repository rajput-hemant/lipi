"use client";

import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";

import type { Route } from "next";
import type { DocumentSummary } from "@/types/db";

import { useNotifyWorkspacePageChanges } from "@/components/realtime/workspace-realtime-provider";
import { useSubscriptionModal } from "@/components/subscription-modal-provider";
import { useAppState } from "@/hooks/use-app-state";
import { createDocument } from "@/lib/db/actions/document";
import {
  isMutationQuotaExceeded,
  runMutationToast,
} from "@/lib/db/mutation-result";

export const ASK_OWNER_TO_UPGRADE =
  "Ask the workspace owner to upgrade to Pro.";

/**
 * Call `begin()` at click time; the returned `push` only navigates if the
 * user is still on the page they clicked from when the server resolves.
 * Reads `window.location` because the caller may have unmounted meanwhile.
 */
export function useGuardedPush() {
  const router = useRouter();

  return function begin() {
    const startedAt = window.location.pathname;
    return <T extends string>(href: Route<T>) => {
      if (window.location.pathname === startedAt) router.push(href);
    };
  };
}

export function useCreateRootPage(workspaceId: string) {
  const beginPush = useGuardedPush();
  const notifyPageChanges = useNotifyWorkspacePageChanges();
  const { setOpen } = useSubscriptionModal();
  const { role, addDocument, deleteDocument } = useAppState();
  const isOwner = role === "owner";

  return function createRootPage(title: string, icon = "") {
    const now = new Date().toISOString();
    const newDocument: DocumentSummary = {
      id: uuid(),
      workspaceId,
      parentId: null,
      title,
      icon,
      bannerUrl: null,
      inTrash: false,
      createdAt: now,
      updatedAt: now,
    };
    const push = beginPush();

    addDocument(newDocument);

    const pending = createDocument(newDocument).then((result) =>
      !isOwner && !result.ok && result.code === "QUOTA_EXCEEDED" ?
        { ...result, message: ASK_OWNER_TO_UPGRADE }
      : result
    );

    runMutationToast(pending, {
      loading: "Creating page...",
      success: () => {
        notifyPageChanges();
        push(`/dashboard/${workspaceId}/${newDocument.id}`);
        return "Page created.";
      },
      failed: "Could not create page.",
      denied: "You do not have permission to create pages.",
      onError: (error) => {
        deleteDocument(newDocument.id);
        if (isOwner && isMutationQuotaExceeded(error)) setOpen(true);
      },
    });
  };
}
