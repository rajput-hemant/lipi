"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import type { ThemeProviderProps } from "next-themes";

import { TooltipProvider } from "./ui/tooltip";

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
      <SessionProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
};
