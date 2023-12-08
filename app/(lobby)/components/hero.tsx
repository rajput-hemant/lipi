import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      id="hero"
      className="flex w-full flex-col items-center justify-center gap-4 text-center"
    >
      <header className="mt-10 flex flex-col items-center gap-4">
        <Badge className="shadow">✨ Your Workspace, Perfected</Badge>

        <h1 className="mt-4 font-heading text-4xl font-bold [text-shadow:_0_4px_0_#e1e1e1] dark:bg-gradient-to-br dark:from-foreground dark:to-gray-500 dark:bg-clip-text dark:text-transparent dark:[text-shadow:none] md:text-7xl">
          All-In-One Collaboration and Productivity Platform
        </h1>

        <h2 className="max-w-xl text-lg text-muted-foreground">
          A Note Taking app built using{" "}
          <ExternalLink href="https://nextjs.org/">
            Next.js (App Router)
          </ExternalLink>
          ,{" "}
          <ExternalLink href="https://www.typescriptlang.org/">
            Typescipt
          </ExternalLink>
          ,{" "}
          <ExternalLink href="https://tailwindcss.com/">
            Tailwind CSS
          </ExternalLink>
          , <ExternalLink href="https://ui.shadcn.com/">shadcn/ui</ExternalLink>
          ,{" "}
          <ExternalLink href="https://orm.drizzle.team/">
            Drizzle ORM
          </ExternalLink>{" "}
          & more!
        </h2>
      </header>

      <div className="flex items-center gap-2 py-2">
        <Link
          href="/login"
          className={cn(buttonVariants({ size: "lg" }), "shadow-lg")}
        >
          Get Started
        </Link>

        <a
          href={siteConfig.links.github}
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Github
        </a>
      </div>

      <Image
        src="/illustrations/home-office.svg"
        alt="Home Office"
        width={500}
        height={500}
        className="drop-shadow-xl dark:invert"
      />
    </section>
  );
}

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
};

const ExternalLink = ({ href, children }: ExternalLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium underline-offset-4 transition-colors hover:text-foreground hover:underline"
  >
    {children}
  </a>
);
