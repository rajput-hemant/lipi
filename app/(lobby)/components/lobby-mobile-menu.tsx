"use client";

import Link from "next/link";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOBBY_LINKS } from "./lobby-links";

export function LobbyMobileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            aria-label="Open navigation menu"
            className="md:hidden pointer-coarse:size-11"
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        {LOBBY_LINKS.map(({ href, label }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem render={<Link href="/login" />} className="sm:hidden">
          Login
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
