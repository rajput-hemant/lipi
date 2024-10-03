import * as React from "react";

import { cn } from "@/lib/utils";

export type KbdProps = React.HTMLAttributes<HTMLElement>;

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        className={cn(
          "inline-flex h-5 items-center justify-center rounded-md border bg-background px-2 text-xs font-medium text-muted-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Kbd.displayName = "Kbd";

export { Kbd };
