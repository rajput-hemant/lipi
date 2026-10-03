"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppState } from "@/hooks/use-app-state";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DocumentCollaborators() {
  const { collaborators } = useAppState();
  if (!collaborators.length) return null;

  const visibleCollaborators = collaborators.slice(0, 4);

  return (
    <div
      className="flex shrink-0 items-center -space-x-2"
      aria-label="Page collaborators"
      role="list"
    >
      {visibleCollaborators.map((collaborator) => (
        <Avatar
          key={collaborator.id}
          className="size-8 shrink-0 border-2 border-background"
          title={collaborator.name}
          role="listitem"
        >
          <AvatarImage
            src={collaborator.image ?? undefined}
            alt={collaborator.name}
          />
          <AvatarFallback
            className="text-xs text-white"
            style={{ backgroundColor: collaborator.color }}
          >
            {initials(collaborator.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {collaborators.length > visibleCollaborators.length ?
        <span
          className="pl-3 text-xs text-muted-foreground"
          role="listitem"
          aria-label={`${collaborators.length - visibleCollaborators.length} more collaborators`}
        >
          +{collaborators.length - visibleCollaborators.length}
        </span>
      : null}
    </div>
  );
}
