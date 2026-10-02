import { Suspense } from "react";

import type { ReactNode } from "react";

import { redirectIfAuthenticated } from "@/lib/auth/redirect-authenticated";

type AuthPageGateProps = {
  searchParams: Promise<{ from?: string }>;
  currentPath: string;
  children: ReactNode;
};

async function AuthRedirectGate({
  searchParams,
  currentPath,
  children,
}: AuthPageGateProps) {
  const params = await searchParams;
  await redirectIfAuthenticated(params.from, currentPath);
  return children;
}

export function AuthPageGate(props: AuthPageGateProps) {
  return (
    <Suspense fallback={null}>
      <AuthRedirectGate {...props} />
    </Suspense>
  );
}
