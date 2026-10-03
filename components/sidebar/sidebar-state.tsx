"use client";

import React from "react";
import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { setCookie } from "cookies-next";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/lib/dashboard/sidebar-cookie";

export const SIDEBAR_ID = "app-sidebar";

type SidebarState = {
  isCollapsed: boolean;
  toggle: () => void;
};

const SidebarStateContext = React.createContext<SidebarState | null>(null);

export function SidebarStateProvider({
  defaultCollapsed,
  children,
}: React.PropsWithChildren<{ defaultCollapsed: boolean }>) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const toggle = React.useCallback(() => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    setCookie(SIDEBAR_COLLAPSED_COOKIE, next, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }, [isCollapsed]);

  const value = React.useMemo(
    () => ({ isCollapsed, toggle }),
    [isCollapsed, toggle]
  );

  return <SidebarStateContext value={value}>{children}</SidebarStateContext>;
}

export function useSidebarState() {
  const context = React.use(SidebarStateContext);
  if (!context) {
    throw new Error("useSidebarState must be used within SidebarStateProvider");
  }
  return context;
}

export function SidebarToggle() {
  const { isCollapsed, toggle } = useSidebarState();
  const label = isCollapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label={label}
            aria-expanded={!isCollapsed}
            aria-controls={SIDEBAR_ID}
            onClick={toggle}
          >
            <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
