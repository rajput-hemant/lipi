import { Separator } from "@/components/ui/separator";
import { LEGAL } from "@/lib/constants";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <>
      <section className="my-10 rounded-3xl bg-muted p-6 md:p-10 lg:p-16 xl:p-20">
        <h1 className="text-center font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-7xl">
          Terms of Service
        </h1>
      </section>

      <section className="my-4 px-6 md:px-10 lg:px-16">
        {LEGAL.termsOfService.sections.map((section, i) => (
          <div key={i} className="mb-8 mt-4">
            <h2
              id={`${section.title.toLowerCase().replace(/\s/g, "-")}`}
              className="font-heading text-lg dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl"
            >
              {i + 1}. {section.title}
            </h2>
            <Separator className="my-2" />
            <p className="my-2 max-w-5xl text-sm text-muted-foreground md:text-base">
              {section.description}
            </p>
          </div>
        ))}

        <p className="my-2 text-center text-sm font-semibold md:text-end">
          Last updated:{" "}
          <span className="font-medium underline underline-offset-4">
            {LEGAL.termsOfService.lastUpdated}
          </span>
        </p>
      </section>
    </>
  );
}
