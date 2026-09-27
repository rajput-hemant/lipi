import { Suspense } from "react";

import { AuthPageGate } from "../components/auth-page-gate";
import { ResetPasswordForm } from "../components/reset-password-form";

export const metadata = {
  title: "Reset Password",
  description: "Reset your password",
};

export const instant = false;

type ResetPasswordPageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  return (
    <AuthPageGate searchParams={searchParams} currentPath="/reset-password">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl">
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthPageGate>
  );
}
