import Link from "next/link";

import { siteConfig } from "@/config/site";
import { GitHub, Logo, X } from "../icons";
import { Separator } from "../ui/separator";
import { NewsletterSubscriptionForm } from "./newsletter-subscription-form";
import { ThemeToggleGroup } from "./theme-toggle-group";

const footerLinks = [
  {
    title: "Product",
    links: ["Wikis", "Projects", "Docs", "AI", "What's new"],
  },
  {
    title: "Download",
    links: ["iOS & Android", "Mac & Windows", "Web Clipper"],
  },
  {
    title: "Policies",
    links: ["Privacy", "Terms of use", "Cookie Preferences"],
  },
  { title: "Support", links: ["Contact us", "FAQs"] },
];

export function SiteFooter() {
  const githubUrl = siteConfig.links.github;

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
                className="duration-200 hover:text-foreground"
              >
                <GitHub className="size-4 shrink-0" />
              </a>

              <Separator orientation="vertical" className="h-4" />

              <a
                aria-label="X/Twitter Handle"
                href={siteConfig.links.x}
                target="_blank"
                rel="noreferrer"
                className="duration-200 hover:text-foreground"
              >
                <X className="size-4 shrink-0" />
              </a>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="flex flex-col gap-2.5">
              <h3 className="mb-1 text-sm font-semibold lg:text-sm">
                {section.title}
              </h3>

              {section.links.map((link) => (
                <a
                  key={link}
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground duration-200 hover:text-foreground"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
          <div className="col-span-full flex w-full flex-col gap-2 lg:max-w-[240px]">
            <h3 className="mb-1.5 text-sm font-semibold lg:text-sm">
              Subscribe to our newsletter
            </h3>

            <p className="mb-1.5 text-[13px] leading-6 text-muted-foreground lg:text-sm">
              Join Our Community! Get exclusive travel offers and insider tips.
            </p>
            <NewsletterSubscriptionForm />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between lg:mt-12">
          <p className="mt-4 text-muted-foreground">
            <span>
              &copy; {new Date().getFullYear()} {siteConfig.name}.
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
