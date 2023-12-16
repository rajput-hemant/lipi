export default function Loading() {
  return (
    <div className="grid h-screen w-full place-items-center">
      <span className="sr-only">Loading...</span>
      <div className="aspect-square h-16 animate-spin rounded-full border-y-2 border-primary lg:h-32" />
    </div>
  );
}
