"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircleIcon,
  File01Icon,
  Loading03Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { SearchDocumentResult } from "@/lib/db/actions/search";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { searchDocumentsInWorkspace } from "@/lib/db/actions/search";
import { cn } from "@/lib/utils";

type SearchCommandProps = {
  className?: string;
  triggerVariant?: "navbar" | "sidebar";
  isCollapsed?: boolean;
};

export function SearchCommand({
  className,
  triggerVariant = "navbar",
  isCollapsed = false,
}: SearchCommandProps) {
  const router = useRouter();
  const pathname = usePathname();
  const workspaceId = pathname.split("/")[2];

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchDocumentResult[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = React.useRef<HTMLElement | null>(null);

  const handleOpen = React.useCallback(() => {
    lastFocusedElementRef.current =
      (document.activeElement as HTMLElement) || triggerRef.current;
    setOpen(true);
  }, []);

  const prevOpenRef = React.useRef(open);
  React.useEffect(() => {
    if (prevOpenRef.current && !open) {
      const elementToFocus =
        lastFocusedElementRef.current || triggerRef.current;
      if (elementToFocus && typeof elementToFocus.focus === "function") {
        requestAnimationFrame(() => {
          elementToFocus.focus();
        });
      }
    }
    prevOpenRef.current = open;
  }, [open]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else handleOpen();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleOpen]);

  React.useEffect(() => {
    if (!open || !workspaceId) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const items = await searchDocumentsInWorkspace(workspaceId, query);
          if (!cancelled) {
            setResults(items);
            setError(null);
          }
        } catch {
          if (!cancelled) {
            setResults([]);
            setError("Failed to search documents. Please try again.");
          }
        }
      });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, workspaceId]);

  const onSelectDocument = React.useCallback(
    (documentId: string | null) => {
      if (!documentId || !workspaceId) return;
      setOpen(false);
      setQuery("");
      setError(null);
      router.push(`/dashboard/${workspaceId}/${documentId}`);
    },
    [router, workspaceId]
  );

  if (!workspaceId) {
    return null;
  }

  return (
    <>
      {triggerVariant === "sidebar" ?
        isCollapsed ?
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon-sm"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              className
            )}
            title="Search (⌘K)"
            aria-label="Search documents"
            onClick={handleOpen}
          >
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </Button>
        : <Button
            ref={triggerRef}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-between gap-2 px-3 text-muted-foreground hover:text-foreground",
              className
            )}
            onClick={handleOpen}
          >
            <span className="flex items-center gap-2 text-xs">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="size-4"
              />
              Search
            </span>
            <Kbd className="text-[10px] text-foreground">⌘K</Kbd>
          </Button>

      : <Button
          ref={triggerRef}
          variant="outline"
          size="sm"
          className={cn(
            "relative h-9 w-9 shrink-0 justify-center rounded-lg bg-background px-0 text-sm text-muted-foreground shadow-none sm:w-64 sm:justify-between sm:px-2.5 sm:pr-2 md:w-80",
            className
          )}
          title="Search (⌘K)"
          aria-label="Search documents"
          onClick={handleOpen}
        >
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="size-4"
            />
            <span className="hidden sm:inline">Search documents...</span>
          </span>
          <Kbd className="hidden sm:inline-flex text-[10px] text-foreground">
            ⌘K
          </Kbd>
        </Button>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Search documents</DialogTitle>
          </DialogHeader>

          <Combobox
            open={true}
            onOpenChange={(next) => {
              if (!next) setOpen(false);
            }}
            value={null}
            onValueChange={(val) => {
              if (typeof val === "string") {
                onSelectDocument(val);
              }
            }}
          >
            <div className="flex items-center border-b px-3">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <ComboboxInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search pages or body text..."
                showTrigger={false}
                showClear={query.length > 0}
                className="w-full border-none shadow-none focus-within:ring-0 focus-within:border-none *:data-[slot=input-group-input]:border-none *:data-[slot=input-group-input]:shadow-none *:data-[slot=input-group-input]:focus-visible:ring-0"
                autoFocus
              />
              {isPending && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  aria-label="Searching"
                  className="size-4 shrink-0 animate-spin text-muted-foreground"
                />
              )}
            </div>

            <ComboboxList className="max-h-80 overflow-y-auto p-2">
              {!isPending && error && (
                <div
                  role="alert"
                  className="flex flex-col items-center justify-center gap-1.5 py-6 text-center text-sm text-destructive"
                >
                  <HugeiconsIcon
                    icon={AlertCircleIcon}
                    strokeWidth={2}
                    className="size-5"
                  />
                  <span>{error}</span>
                </div>
              )}

              {!isPending && !error && results.length === 0 && (
                <ComboboxEmpty className="flex py-6 text-center text-sm text-muted-foreground">
                  {query.trim() ?
                    `No pages match “${query.trim()}”.`
                  : "No pages in this workspace yet."}
                </ComboboxEmpty>
              )}

              {!error &&
                results.map((doc) => (
                  <ComboboxItem
                    key={doc.id}
                    value={doc.id}
                    className="flex cursor-pointer flex-col items-start gap-1 rounded-md px-3 py-2 text-left"
                  >
                    <div className="flex w-full items-center gap-2">
                      {doc.icon ?
                        <span className="text-base">{doc.icon}</span>
                      : <HugeiconsIcon
                          icon={File01Icon}
                          strokeWidth={2}
                          className="size-4 text-muted-foreground"
                        />
                      }
                      <span className="truncate font-medium text-foreground">
                        {doc.title}
                      </span>
                    </div>
                    {doc.snippet && (
                      <p className="line-clamp-1 pl-6 text-xs text-muted-foreground">
                        {doc.snippet}
                      </p>
                    )}
                  </ComboboxItem>
                ))}
            </ComboboxList>
          </Combobox>
        </DialogContent>
      </Dialog>
    </>
  );
}
