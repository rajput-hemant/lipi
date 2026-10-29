import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10"
    >
      <span className="sr-only">Loading page</span>
      <div className="space-y-4">
        <Skeleton className="size-12 rounded-md" />
        <Skeleton className="h-10 w-2/3" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-3/5" />
      </div>
    </div>
  );
}
