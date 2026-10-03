import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight01Icon,
  Clock01Icon,
  File01Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getDocuments } from "@/lib/db/actions/document";
import {
  assertWorkspaceAccess,
  getWorkspaceMembershipRole,
} from "@/lib/db/data/mutation-auth";
import { hasWorkspacePermission } from "@/lib/workspace/permissions";
import { InviteNotice, isInvalidInvite } from "../../invite-notice";
import { UpdatedDate } from "./updated-date";
import { sortByRecentlyUpdated, withParentTitles } from "./workspace-pages";

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ invite?: string | string[] }>;
};

export const instant = false;

export async function generateMetadata({
  params,
}: WorkspacePageProps): Promise<Metadata> {
  const { workspaceId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Workspace" };

  try {
    const workspace = await assertWorkspaceAccess(user.id, workspaceId);
    return {
      title: workspace.title || "Workspace",
    };
  } catch {
    return { title: "Workspace" };
  }
}

export default async function WorkspacePage({
  params,
  searchParams,
}: WorkspacePageProps) {
  const { workspaceId } = await params;
  const { invite } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let membership;
  try {
    membership = await getWorkspaceMembershipRole(user.id, workspaceId);
  } catch {
    notFound();
  }
  const { workspace, role } = membership;
  const canEdit = hasWorkspacePermission(role, "document:write");

  const documents = await getDocuments(workspaceId);
  const activeDocuments = withParentTitles(
    sortByRecentlyUpdated(documents.filter((doc) => !doc.inTrash))
  );

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8">
        {isInvalidInvite(invite) && <InviteNotice className="mb-6" />}

        <div className="flex flex-col gap-3 pb-8 border-b">
          <div className="flex items-center gap-3">
            {workspace.iconId ?
              <span
                className="shrink-0 text-4xl sm:text-5xl select-none"
                aria-hidden
              >
                {workspace.iconId}
              </span>
            : <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <HugeiconsIcon
                  icon={Folder01Icon}
                  strokeWidth={2}
                  className="size-6"
                />
              </div>
            }
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {workspace.title}
              </h1>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {activeDocuments.length === 1 ?
                    "1 page"
                  : `${activeDocuments.length} pages`}
                </span>
                {!canEdit && (
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    View only
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Pages
            </h2>
          </div>

          {activeDocuments.length > 0 ?
            <div className="grid gap-3 sm:grid-cols-2">
              {activeDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/dashboard/${workspaceId}/${doc.id}`}
                  className="group relative flex flex-col justify-between rounded-xl border bg-card p-4 text-card-foreground shadow-xs transition-all hover:border-foreground/20 hover:bg-muted/40 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-xl" aria-hidden>
                      {doc.icon ?
                        doc.icon
                      : <HugeiconsIcon
                          icon={File01Icon}
                          strokeWidth={2}
                          className="size-5 text-muted-foreground"
                        />
                      }
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:text-primary">
                        {doc.title || "Untitled"}
                      </p>
                      {doc.parentTitle && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          in {doc.parentTitle}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          strokeWidth={2}
                          className="size-3.5 shrink-0"
                        />
                        <UpdatedDate iso={doc.updatedAt} />
                      </div>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                    />
                  </div>
                </Link>
              ))}
            </div>
          : <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <HugeiconsIcon
                    icon={File01Icon}
                    strokeWidth={1.5}
                    className="size-6"
                  />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  No pages yet
                </h3>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                  {canEdit ?
                    "Use the + button next to Pages in the sidebar to start writing, taking notes, and collaborating."
                  : "You have view-only access. Pages added by the owner or an editor will show up here."
                  }
                </p>
              </CardContent>
            </Card>
          }
        </div>
      </div>
    </div>
  );
}
