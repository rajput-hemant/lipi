"use client";

import { MonitorIcon, Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            className="pointer-coarse:size-11"
          >
            <HugeiconsIcon
              icon={Sun01Icon}
              strokeWidth={2}
              className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            />
            <HugeiconsIcon
              icon={Moon01Icon}
              strokeWidth={2}
              className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            />

            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer"
        >
          <HugeiconsIcon
            icon={Sun01Icon}
            strokeWidth={2}
            className="mr-2 size-4 shrink-0"
          />
          Light
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer"
        >
          <HugeiconsIcon
            icon={Moon01Icon}
            strokeWidth={2}
            className="mr-2 size-4 shrink-0"
          />
          Dark
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer"
        >
          <HugeiconsIcon
            icon={MonitorIcon}
            strokeWidth={2}
            className="mr-2 size-4 shrink-0"
          />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
