import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3">
      <HugeiconsIcon
        icon={Loading03Icon}
        strokeWidth={2}
        className="size-8 animate-spin text-muted-foreground"
      />
      <span className="text-sm font-medium text-muted-foreground">
        Loading...
      </span>
    </div>
  );
}
