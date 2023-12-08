"use client";

import React from "react";
import { Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ThemeToggleGroupProps = {
  className?: string;
};

export function ThemeToggleGroup({ className }: ThemeToggleGroupProps) {
  const isMounted = useIsMounted();
  const { theme, setTheme } = useTheme();

  function handleThemeChange(value: string) {
    setTheme(value);
  }

  return (
    <ToggleGroup
      type="single"
      value={isMounted() ? theme : "system"}
      onValueChange={handleThemeChange}
      className={cn("rounded-full border p-1", className)}
    >
      <ToggleGroupItem
        aria-label="Toggle Light Mode"
        value="light"
        className="h-8 w-8 rounded-full px-2"
      >
        <SunMedium className="h-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle System Mode"
        value="system"
        className="h-8 w-8 rounded-full px-2"
      >
        <Monitor className="h-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle Dark Mode"
        value="dark"
        className="h-8 w-8 rounded-full px-2"
      >
        <Moon className="h-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
