"use client";

import React from "react";
import { MonitorIcon, Moon01Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type ThemeToggleGroupProps = {
  className?: string;
};

export function ThemeToggleGroup({ className }: ThemeToggleGroupProps) {
  const { theme, setTheme } = useTheme();

  function handleThemeChange(value: string) {
    setTheme(value);
  }

  return (
    <ToggleGroup
      value={[theme ?? "system"]}
      onValueChange={([value]) => {
        if (value) handleThemeChange(value);
      }}
      className={cn("rounded-full border p-1", className)}
    >
      <ToggleGroupItem
        aria-label="Toggle Light Mode"
        value="light"
        className="size-8 rounded-full px-2"
      >
        <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} className="h-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle System Mode"
        value="system"
        className="size-8 rounded-full px-2"
      >
        <HugeiconsIcon icon={MonitorIcon} strokeWidth={2} className="h-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle Dark Mode"
        value="dark"
        className="size-8 rounded-full px-2"
      >
        <HugeiconsIcon icon={Moon01Icon} strokeWidth={2} className="h-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
