"use client";

import type { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import {
  Tooltip,
  TooltipProvider,
} from "@/components/ui/tooltip";

type TooltipDelayedProps = TooltipPrimitive.Root.Props & {
  delay: number;
};

export function TooltipDelayed({
  delay,
  children,
  ...props
}: TooltipDelayedProps) {
  return (
    <TooltipProvider delay={delay}>
      <Tooltip {...props}>{children}</Tooltip>
    </TooltipProvider>
  );
}
