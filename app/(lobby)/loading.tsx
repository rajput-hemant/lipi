import { Skeleton } from "@/components/ui/skeleton";

export default function LobbyLoading() {
  return (
    <div className="container space-y-12 py-12">
      {/* Hero Skeleton */}
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-14 w-full max-w-xl rounded-lg" />
        <Skeleton className="h-6 w-3/4 max-w-md" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      {/* Feature visual skeleton */}
      <div className="mx-auto max-w-4xl pt-6">
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}
