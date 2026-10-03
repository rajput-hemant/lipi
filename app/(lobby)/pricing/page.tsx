import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth";
import { PricingPlans } from "./pricing-plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for individuals and collaborative teams.",
};

export const instant = false;

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <section className="flex flex-col gap-6 py-8 md:gap-10">
      <div className="flex flex-col gap-4 rounded-3xl bg-muted p-6 md:p-10 lg:p-16 xl:p-20">
        <h1 className="text-center font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-7xl">
          Simple, transparent pricing
        </h1>
        <p className="text-center leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Unlock unlimited documents, real-time collaboration, and workspaces
          for your team.
        </p>
      </div>

      <PricingPlans isAuthenticated={!!user} />

      <div className="mx-auto max-w-[58rem] text-muted-foreground">
        <span className="font-handwriting font-semibold lowercase text-foreground">
          {siteConfig.name}
        </span>{" "}
        is a demo app.{" "}
        <strong>You can test the upgrade and won&apos;t be charged.</strong>
      </div>
    </section>
  );
}
