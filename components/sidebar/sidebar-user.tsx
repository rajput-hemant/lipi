"use client";

import Link from "next/link";
import { UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useSubscriptionModal } from "@/components/subscription-modal-provider";
import { useAppState } from "@/hooks/use-app-state";
import { SignOut } from "../sign-out";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

function UserDetails() {
  const { user } = useAppState();
  const { hasProEntitlement } = useSubscriptionModal();

  return (
    <div className="min-w-0 flex-1 font-medium">
      <p className="line-clamp-1 text-sm">
        {user?.name ?? "Update your profile"}
      </p>
      <p className="line-clamp-1 text-xs text-muted-foreground">
        {hasProEntitlement ? "Pro plan" : "Free plan"}
      </p>
      <Link
        href="/dashboard/change-password"
        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
      >
        Change password
      </Link>
    </div>
  );
}

function UserAvatar({ className }: { className?: string }) {
  const { user } = useAppState();

  return (
    <Avatar className={className}>
      <AvatarImage src={user?.image ?? undefined} />
      <AvatarFallback>
        <HugeiconsIcon
          icon={UserIcon}
          strokeWidth={2}
          className="size-5 text-muted-foreground"
        />
      </AvatarFallback>
    </Avatar>
  );
}

const signOutProps = {
  size: "icon",
  variant: "ghost",
  className: "shrink-0 rounded-full text-muted-foreground",
} as const;

export function SidebarUser({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <Popover>
        <PopoverTrigger
          aria-label="Account menu"
          className="mx-auto flex rounded-full border p-0.5 shadow hover:shadow-xl"
        >
          <UserAvatar />
        </PopoverTrigger>
        <PopoverContent side="right" className="flex items-center gap-2">
          <UserDetails />
          <SignOut {...signOutProps} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background p-2 shadow-sm">
      <UserAvatar />
      <UserDetails />
      <SignOut {...signOutProps} />
    </div>
  );
}
