import { Suspense } from "react";

import { AuthPageGate } from "../components/auth-page-gate";
import { LoginForm } from "../components/login-form";

export const metadata = {
  title: "Login",
  description: "Login to access your account",
};

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <AuthPageGate searchParams={searchParams} currentPath="/login">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl md:text-5xl">
          Login
        </h1>

        <p className="text-sm text-muted-foreground">
          Enter your credentials below to login
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </AuthPageGate>
  );
}
