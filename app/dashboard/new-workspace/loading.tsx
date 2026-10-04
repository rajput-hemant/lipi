import { Skeleton } from "@/components/ui/skeleton";

export default function NewWorkspaceLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex min-h-dvh items-center justify-center [&_[data-slot=skeleton]]:motion-reduce:animate-none"
    >
      <span className="sr-only">Loading workspace setup</span>

      <section className="relative hidden min-h-dvh w-full items-center justify-center bg-zinc-900 lg:flex">
        <Skeleton className="size-72 rounded-3xl bg-zinc-800" />
      </section>

      <section className="flex size-full flex-col items-center justify-center gap-14 px-4 py-10">
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <Skeleton className="h-10 w-3/4 sm:h-12" />
          <Skeleton className="h-10 w-1/2 sm:h-12" />
        </div>

        <div className="h-fit w-full max-w-xl space-y-6 rounded-xl border bg-card p-6 shadow-lg">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </section>
    </div>
  );
}
