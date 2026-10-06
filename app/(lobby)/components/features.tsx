import {
  File01Icon,
  Folder01Icon,
  Search01Icon,
  Share01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

const treeRows = [
  { icon: "🏠", label: "Team Overview" },
  { icon: Folder01Icon, label: "Product Specs" },
  { icon: "📋", label: "Q3 Product Roadmap", active: true },
  { icon: File01Icon, label: "Design System" },
  { icon: File01Icon, label: "Weekly Notes" },
  { icon: "💡", label: "Brainstorming" },
];

const doneItems = [
  "Integrate BlockNote rich text document editor",
  "Shared document editing in workspaces",
  "Command+K workspace full-text document search",
];

export function Features() {
  return (
    <section id="features" className="space-y-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-6xl">
          Everything your team needs in one workspace
        </h2>

        <p className="max-w-[85%] text-muted-foreground sm:text-lg">
          Capture notes, organize nested documents, and edit together in shared
          workspaces.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex h-11 items-center justify-between border-b border-border bg-muted/50 px-4">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#ef4444]" />
            <span className="size-3 rounded-full bg-[#f59e0b]" />
            <span className="size-3 rounded-full bg-[#10b981]" />
            <span className="ml-2 text-xs font-semibold text-muted-foreground">
              🚀 Acme Workspace
            </span>
          </div>

          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <span>Documents</span>
            <span>/</span>
            <span>Product Specs</span>
            <span>/</span>
            <span className="font-medium text-foreground">
              📋 Q3 Product Roadmap
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <Avatar className="size-6 border-2 border-background ring-1 ring-emerald-500">
                <AvatarFallback className="bg-emerald-700 text-[10px] text-white">
                  HR
                </AvatarFallback>
              </Avatar>
              <Avatar className="size-6 border-2 border-background ring-1 ring-violet-500">
                <AvatarFallback className="bg-violet-700 text-[10px] text-white">
                  AS
                </AvatarFallback>
              </Avatar>
            </div>

            <Badge
              variant="outline"
              className="hidden gap-1 text-[11px] font-normal text-emerald-700 dark:text-emerald-400 sm:inline-flex"
            >
              <HugeiconsIcon
                icon={Tick02Icon}
                strokeWidth={2}
                className="size-3"
              />
              Saved
            </Badge>

            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
            >
              <HugeiconsIcon
                icon={Share01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              Share
            </Button>
          </div>
        </div>

        <div className="flex min-h-[460px]">
          <div className="hidden w-56 flex-col border-r border-border bg-muted/20 p-3 md:flex">
            <div className="mb-3 flex items-center justify-between rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground shadow-xs">
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
                Search...
              </span>
              <Kbd className="text-[10px]">⌘K</Kbd>
            </div>

            <div className="space-y-1 text-xs">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace
              </div>
              {treeRows.map(({ icon, label, active }) => (
                <div
                  key={label}
                  className={
                    active ?
                      "flex items-center gap-2 rounded-md bg-accent px-2 py-1.5 font-medium text-accent-foreground"
                    : "flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted"
                  }
                >
                  {typeof icon === "string" ?
                    <span>{icon}</span>
                  : <HugeiconsIcon icon={icon} className="size-3.5" />}
                  <span className={active ? "truncate" : undefined}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-background">
            <div className="h-28 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 sm:h-36" />

            <div className="relative mx-auto max-w-2xl px-6 pb-8 pt-4">
              <div className="-mt-12 mb-3 flex items-center gap-3 sm:-mt-14">
                <span className="flex size-14 items-center justify-center rounded-xl bg-background text-3xl shadow-md ring-1 ring-border sm:size-16 sm:text-4xl">
                  📋
                </span>
                <div className="mt-8 flex gap-1.5">
                  <Badge variant="secondary" className="text-[11px]">
                    Roadmap
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[11px] text-muted-foreground"
                  >
                    Live Session
                  </Badge>
                </div>
              </div>

              <p className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Q3 Product Roadmap & Launch Plan
              </p>

              <div className="mt-4 space-y-3.5 text-sm">
                <p className="leading-relaxed text-muted-foreground">
                  Lipi combines block-based editing with nested pages per
                  workspace. Teammates can work on the same document with shared
                  editing and live updates.
                </p>

                <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs sm:text-sm">
                  <span className="text-base leading-none">💡</span>
                  <div className="text-muted-foreground">
                    <strong className="text-foreground">Pro-tip:</strong> Type{" "}
                    <Kbd className="text-[11px]">/</Kbd> anywhere to summon
                    slash commands for headings, code blocks, checklists, and
                    tables.
                  </div>
                </div>

                <h3 className="pt-2 font-heading text-base font-semibold text-foreground sm:text-lg">
                  🎯 Target Deliverables
                </h3>

                <div className="space-y-1.5 text-xs sm:text-sm">
                  {doneItems.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        readOnly
                        aria-label={item}
                        className="size-4 rounded border-input accent-primary"
                      />
                      <span className="text-muted-foreground line-through">
                        {item}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      readOnly
                      aria-label="Finalize production launch polish and SEO metadata"
                      className="size-4 rounded border-input accent-primary"
                    />
                    <span className="text-foreground">
                      Finalize production launch polish and SEO metadata
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs">
                      Collaborator
                    </span>
                  </div>
                </div>

                <div className="relative mt-3 inline-block rounded-lg border border-border bg-popover p-1 text-xs shadow-lg">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    Insert Block
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-accent px-2.5 py-1 font-medium text-accent-foreground">
                    <span className="font-bold">H1</span>
                    <span>Heading 1</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2.5 py-1 text-muted-foreground hover:bg-muted">
                    <span>•</span>
                    <span>Bulleted list</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2.5 py-1 text-muted-foreground hover:bg-muted">
                    <span className="font-mono">{"</>"}</span>
                    <span>Code block</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
