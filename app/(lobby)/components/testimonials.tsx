import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LOBBY_CAPABILITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Testimonials() {
  return (
    <section id="capabilities" className="container">
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-6xl">
          What you can do with Lipi
        </h2>

        <p className="max-w-[85%] text-muted-foreground sm:text-lg">
          Core product capabilities in the app today - described in plain
          language, without invented user stories.
        </p>
      </div>

      <div
        className={cn(
          "relative -mx-10 flex flex-col overflow-hidden pb-10 md:mx-0",
          "before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-background md:before:w-72",
          "after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-background md:after:w-72"
        )}
      >
        {[...Array(2)].map((_, rowIndex) => (
          <div
            key={`capability-row-${rowIndex}`}
            className={cn(
              "mt-10 flex flex-nowrap gap-6 self-start",
              {
                "flex-row-reverse": rowIndex === 1,
                "animate-[slide_250s_linear_infinite]": true,
                "animate-[slide_250s_linear_infinite_reverse]": rowIndex === 1,
                "ml-[100vw]": rowIndex === 1,
              },
              "hover:paused"
            )}
          >
            {LOBBY_CAPABILITIES.map(({ title, description }) => (
              <Card
                key={`${rowIndex}-${title}`}
                className="w-[28rem] shrink-0 rounded-xl duration-300 hover:shadow-md dark:bg-gradient-to-br dark:from-border/50 dark:to-background"
              >
                <CardHeader>
                  <CardTitle className="drop-shadow-2xl">{title}</CardTitle>
                  <CardDescription className="sr-only">
                    Product capability
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-[15px] leading-5 text-muted-foreground">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
