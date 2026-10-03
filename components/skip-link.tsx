export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only z-50 rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-ring"
    >
      Skip to content
    </a>
  );
}
