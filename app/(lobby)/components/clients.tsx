import Image from "next/image";

import { CLIENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Clients() {
  return (
    <section id="clients" className="space-y-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-foreground dark:to-gray-500 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-6xl">
          Our Valued Clients
        </h2>

        <p className="max-w-[85%] text-muted-foreground sm:text-lg">
          Discover the companies we&apos;ve had the pleasure to work with
        </p>
      </div>

      <div
        className={cn(
          "relative flex h-24 items-center overflow-hidden whitespace-nowrap",
          "before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-40 before:bg-gradient-to-r before:from-background md:before:w-96",
          "after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-40 after:bg-gradient-to-l after:from-background md:after:w-96"
        )}
      >
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="flex animate-[15s_slide_linear_infinite] flex-nowrap"
          >
            {CLIENTS.map(({ alt, logo }) => (
              <div
                key={alt}
                className="m-5 flex w-24 shrink-0 items-center md:m-14"
              >
                <Image
                  src={logo}
                  alt={alt}
                  width={200}
                  className="max-w-none object-contain grayscale"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
