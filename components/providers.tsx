"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

type Props = {
  theme?: ThemeProviderProps;
  children: React.ReactNode;
};

export function Providers({ children, theme }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...theme}
    >
      {children}
    </ThemeProvider>
  );
}
