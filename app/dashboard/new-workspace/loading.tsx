import { Skeleton } from "@/components/ui/skeleton";

export default function NewWorkspaceLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <section className="flex size-full flex-col items-center justify-center gap-14 px-4 py-10 [&_[data-slot=skeleton]]:motion-reduce:animate-none">
        <div className="flex w-full max-w-xl flex-col items-center gap-3">
          <Skeleton className="h-10 w-3/4 sm:h-12" />
          <Skeleton className="h-10 w-1/2 sm:h-12" />
        </div>

        <div className="w-full max-w-xl space-y-4 rounded-xl border p-6 shadow-lg">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </section>
    </div>
  );
}
