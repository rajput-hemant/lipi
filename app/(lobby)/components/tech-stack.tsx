import React from "react";

import type { IconProps } from "@/components/icons";

import {
  Auth,
  Nextjs,
  Reactjs,
  Stripe,
  Supabase,
  Tailwind,
} from "@/components/icons";

type Tech = {
  title: string;
  description: string;
  icon: React.FC<IconProps>;
};

const techs: Tech[] = [
  {
    title: "Next.js",
    description: "App dir, Routing, Layouts, Loading UI and API routes.",
    icon: Nextjs,
  },
  {
    title: "React 18",
    description: "Server and Client Components. Use hook.",
    icon: Reactjs,
  },
  {
    title: "Database",
    description: "ORM using Drizzle and deployed on Subabase.",
    icon: Supabase,
  },
  {
    title: "Components",
    description:
      "UI components built using shadcn/ui and styled with Tailwind CSS.",
    icon: Tailwind,
  },
  {
    title: "Authentication",
    description: "Authentication using NextAuth.js and middlewares.",
    icon: Auth,
  },
  {
    title: "Subscriptions",
    description: "Free and paid subscriptions using Stripe.",
    icon: Stripe,
  },
];

export function TechStack() {
  return (
    <section
      id="tech-stack"
      className="container space-y-6 rounded-3xl bg-muted py-8 md:py-12 lg:py-24"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-6xl">
          Tech Stack
        </h2>

        <p className="max-w-[85%] text-muted-foreground sm:text-lg">
          This project is an experiment to see how a modern app, with features
          like auth, subscriptions, API routes, and static pages would work in
          Next.js app dir.
        </p>
      </div>

      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-5xl md:grid-cols-3">
        {techs.map(({ title, description, icon: Icon }, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-lg border bg-background p-2"
          >
            <div className="flex h-44 flex-col justify-between rounded-md p-6">
              <Icon size={48} />

              <div className="space-y-2">
                <h3 className="font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description} </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
