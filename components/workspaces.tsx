"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import type { Workspace } from "@/types/db";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { listWorkspacesForCurrentUser } from "@/lib/db/actions/workspace";
import { cn } from "@/lib/utils";

type WorkspaceGroups = {
  privateWorkspaces: Workspace[];
  collaborating: Workspace[];
  shared: Workspace[];
};

function WorkspaceRow({
  workspace,
  activeWorkspaceId,
  badge,
}: {
  workspace: Workspace;
  activeWorkspaceId?: string;
  badge?: string;
}) {
  const isActive = workspace.id === activeWorkspaceId;

  return (
    <Link
      href={`/dashboard/${workspace.id}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2 outline-none transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        isActive && "border-primary bg-muted/40"
      )}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {workspace.iconId}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{workspace.title}</p>
        {badge && (
          <Badge variant="secondary" className="mt-1 text-[10px] uppercase">
            {badge}
          </Badge>
        )}
      </div>
    </Link>
  );
}

function WorkspaceSection({
  title,
  workspaces,
  activeWorkspaceId,
  badge,
}: {
  title: string;
  workspaces: Workspace[];
  activeWorkspaceId?: string;
  badge?: string;
}) {
  if (workspaces.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">
        {workspaces.map((workspace) => (
          <WorkspaceRow
            key={workspace.id}
            workspace={workspace}
            activeWorkspaceId={activeWorkspaceId}
            badge={badge}
          />
        ))}
      </div>
    </section>
  );
}

export function Workspaces() {
  const pathname = usePathname();
  const activeWorkspaceId = pathname.split("/")[2];
  const [groups, setGroups] = React.useState<WorkspaceGroups | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    listWorkspacesForCurrentUser()
      .catch(() => {
        if (!cancelled) toast.error("Failed to load workspaces");
        return null;
      })
      .then((data) => {
        if (!cancelled) {
          if (data) setGroups(data);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading workspaces"
        className="flex items-center justify-center py-12 text-muted-foreground"
      >
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="size-5 animate-spin"
        />
      </div>
    );
  }

  if (!groups) {
    return (
      <p className="text-sm text-muted-foreground">
        Unable to load workspaces.
      </p>
    );
  }

  const isEmpty =
    groups.privateWorkspaces.length === 0 &&
    groups.collaborating.length === 0 &&
    groups.shared.length === 0;

  return (
    <div className="space-y-4">
      <ScrollArea className="max-h-[min(60vh,28rem)] pr-3">
        <div className="space-y-6 pb-2">
          <WorkspaceSection
            title="Private"
            workspaces={groups.privateWorkspaces}
            activeWorkspaceId={activeWorkspaceId}
          />
          <WorkspaceSection
            title="Shared with others"
            workspaces={groups.shared}
            activeWorkspaceId={activeWorkspaceId}
            badge="Owner"
          />
          <WorkspaceSection
            title="Collaborating"
            workspaces={groups.collaborating}
            activeWorkspaceId={activeWorkspaceId}
            badge="Member"
          />
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {isEmpty && (
        <p className="text-sm text-muted-foreground">
          No workspaces yet. Create one from the dashboard.
        </p>
      )}

      <div className="flex justify-end">
        <Button render={<Link href="/dashboard/new-workspace" />}>
          New workspace
        </Button>
      </div>
    </div>
  );
}
