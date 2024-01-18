import Image from "next/image";

import { GitHub } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { getGitHubStars } from "@/lib/utils";

export async function OpenSource() {
  const stars = await getGitHubStars();

  return (
    <section id="open-source">
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-muted py-8 text-center md:py-12 xl:py-16">
        <h2 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-6xl">
          Proudly Open Source
        </h2>

        <p className="max-w-[85%] text-muted-foreground sm:text-lg">
          {siteConfig.name} is open source and powered by open source software.{" "}
          <br /> The code is available on{" "}
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 duration-200 hover:text-foreground"
          >
            GitHub
          </a>
          .
        </p>

        {stars && (
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="flex"
          >
            <div className="flex size-10 items-center justify-center rounded-md bg-foreground shadow-md hover:shadow-lg">
              <GitHub className="size-6 text-background" />
            </div>

            <div className="flex items-center">
              <div className="size-4 border-y-8 border-r-8 border-foreground border-y-transparent" />
              <div className="flex h-10 items-center rounded-md border border-foreground bg-foreground px-4 font-medium text-background shadow-md hover:shadow-lg">
                {stars} stars on GitHub
              </div>
            </div>
          </a>
        )}
      </div>

      <Image
        src="/illustrations/work-party.svg"
        alt="Work Party"
        width={500}
        height={500}
        className="ml-auto drop-shadow-xl dark:invert"
      />
    </section>
  );
}
