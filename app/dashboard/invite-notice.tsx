import { cn } from "@/lib/utils";

export const INVALID_INVITE_QUERY = "?invite=invalid";

export function isInvalidInvite(invite: string | string[] | undefined) {
  return invite === "invalid";
}

export function InviteNotice({ className }: { className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className
      )}
    >
      <p className="font-medium">This invite is invalid or has expired.</p>
      <p className="mt-0.5 text-destructive/80">
        Ask the workspace owner to send you a new one.
      </p>
    </div>
  );
}
