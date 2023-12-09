import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function LobbyNavbar() {
  return (
    <header className="mt-3 h-14">
      <nav className="container flex h-full items-center justify-between">
        <Link
          href="/"
          className="px-4 font-handwriting text-xl font-bold lowercase [text-shadow:_0_2px_0_#e1e1e1] dark:[text-shadow:none]"
        >
          {siteConfig.name}
        </Link>

        <div className="hidden space-x-4 px-10 text-sm font-medium text-muted-foreground md:inline-block">
          <Link
            href="/#features"
            className="transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </div>

        <div className="flex flex-1 justify-end gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden h-8 rounded-full px-5 font-semibold sm:inline-flex"
            )}
          >
            Login
          </Link>

          <Link
            href="/signup"
            className={cn(
              buttonVariants(),
              "h-8 rounded-full px-3 font-semibold shadow-xl"
            )}
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
}
