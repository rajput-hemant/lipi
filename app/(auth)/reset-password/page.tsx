import { Suspense } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ResetPasswordForm } from "../components/reset-password-form";

export const metadata = {
  title: "Reset password",
  description: "Choose a new password",
  referrer: "no-referrer",
};

export const instant = false;

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

async function ResetPasswordContent({ searchParams }: ResetPasswordPageProps) {
  const { token, error } = await searchParams;

  if (!token || error) {
    return (
      <div className="mt-4 space-y-4">
        <p role="alert" className="text-sm">
          This reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className={buttonVariants({ size: "sm" })}
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage(props: ResetPasswordPageProps) {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl">
        Reset password
      </h1>

      <p className="text-sm text-muted-foreground">Choose a new password</p>

      <Suspense fallback={null}>
        <ResetPasswordContent {...props} />
      </Suspense>
    </div>
  );
}
