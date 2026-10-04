import Link from "next/link";
import { connection } from "next/server";

import { siteConfig } from "@/config/site";
import { GitHub, Logo, X } from "../icons";
import { Separator } from "../ui/separator";
import { ThemeToggleGroup } from "./theme-toggle-group";

const footerLinks = [
  {
    title: "Policies",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms of use", href: "/terms" },
    ],
  },
] as const;

export async function SiteFooter() {
  await connection();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-10">
      <div className="mx-auto w-full max-w-none px-5 text-sm sm:max-w-[90%] sm:px-0 2xl:max-w-7xl">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] items-stretch justify-between gap-y-10 sm:gap-x-6 md:flex md:flex-wrap">
          <div className="col-span-full flex items-center justify-between gap-4 md:flex-col">
            <Link
              href="/"
              className="flex gap-2 font-handwriting text-xl lowercase [text-shadow:_0_2px_0_#e1e1e1] dark:[text-shadow:none]"
            >
              <Logo size={28} />
              {siteConfig.name}
            </Link>

            <div className="flex justify-center gap-3 text-muted-foreground">
              <a
                aria-label="GitHub Repository"
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="-m-2.5 p-2.5 duration-200 hover:text-foreground"
              >
                <GitHub className="size-4 shrink-0" />
              </a>

              <Separator orientation="vertical" className="h-4" />

              <a
                aria-label="X/Twitter Handle"
                href={siteConfig.links.x}
                target="_blank"
                rel="noreferrer"
                className="-m-2.5 p-2.5 duration-200 hover:text-foreground"
              >
                <X className="size-4 shrink-0" />
              </a>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="flex flex-col gap-2.5">
              <h2 className="mb-1 text-sm font-semibold lg:text-sm">
                {section.title}
              </h2>

              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground duration-200 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between lg:mt-12">
          <p className="mt-4 text-muted-foreground">
            <span>
              &copy; {year} {siteConfig.name}.
            </span>{" "}
            <span>
              Illustrations by{" "}
              <a
                href="https://popsy.co/"
                className="underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Popsy.
              </a>
            </span>
          </p>

          <ThemeToggleGroup />
        </div>
      </div>
    </footer>
  );
}
