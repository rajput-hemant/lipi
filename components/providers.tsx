"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { z } from "zod";

import type { ThemeProviderProps } from "next-themes";

import { TooltipProvider } from "./ui/tooltip";

// Skips Zod's `new Function` probe, which a CSP without `unsafe-eval` reports as a violation.
z.config({ jitless: true });

export const Providers: React.FCC<{
  theme?: ThemeProviderProps;
}> = ({ children, theme }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...theme}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
};
