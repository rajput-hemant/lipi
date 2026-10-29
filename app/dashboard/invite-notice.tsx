import { cn } from "@/lib/utils";

const INVITE_NOTICES = {
  invalid: {
    title: "This invite is invalid.",
    hint: "Ask the workspace owner to send you a new one.",
  },
  expired: {
    title: "This invite has expired.",
    hint: "Ask the workspace owner to send you a new one.",
  },
  "wrong-account": {
    title: "This invite was sent to a different email address.",
    hint: "Sign in with the email address that received it.",
  },
};

export type InviteReason = keyof typeof INVITE_NOTICES;

export function isInvalidInvite(
  invite: string | string[] | undefined
): invite is InviteReason {
  return typeof invite === "string" && Object.hasOwn(INVITE_NOTICES, invite);
}

export function InviteNotice({
  className,
  reason = "invalid",
}: {
  className?: string;
  reason?: InviteReason;
}) {
  const { title, hint } = INVITE_NOTICES[reason];

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-destructive/80">{hint}</p>
    </div>
  );
}
