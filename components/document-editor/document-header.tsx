"use client";

import React from "react";
import {
  ImageAdd02Icon,
  Loading03Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import type { Document } from "@/types/db";

import { EmojiPicker } from "@/components/emoji-picker";
import { useNotifyWorkspacePageChanges } from "@/components/realtime/workspace-realtime-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/hooks/use-app-state";
import {
  coverStyleForBannerUrl,
  documentCoverPresets,
} from "@/lib/block-editor/cover-presets";
import { useDebouncedCallback } from "@/lib/block-editor/use-debounced-callback";
import { updateDocumentInDb } from "@/lib/db/queries";
import { uploadFiles } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

type DocumentHeaderProps = {
  document: Document;
};

export function DocumentHeader({ document }: DocumentHeaderProps) {
  const { updateDocument: updateDocumentState } = useAppState();
  const notifyPageChanges = useNotifyWorkspacePageChanges();
  const savedTitleRef = React.useRef(document.title);

  const [title, setTitle] = React.useState(document.title);
  const [icon, setIcon] = React.useState(document.icon);
  const [bannerUrl, setBannerUrl] = React.useState(document.bannerUrl);

  const { debounced: persistMetadata } = useDebouncedCallback(
    async (patch: {
      title?: string;
      icon?: string;
      bannerUrl?: string | null;
    }) => {
      try {
        const updated = await updateDocumentInDb({
          id: document.id,
          ...patch,
        });
        updateDocumentState(updated);
        if (patch.title !== undefined || patch.icon !== undefined) {
          notifyPageChanges();
        }
        if (updated.title) {
          savedTitleRef.current = updated.title;
        }
      } catch {
        toast.error("Could not save document details.");
      }
    },
    500
  );

  function onTitleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);

    const trimmed = nextTitle.trim();
    if (trimmed.length < 1) {
      toast.warning("Title is required.");
      setTitle(savedTitleRef.current);
      return;
    }

    persistMetadata({ title: trimmed });
  }

  function onIconChange(nextIcon: string) {
    setIcon(nextIcon);
    persistMetadata({ icon: nextIcon });
  }

  function onBannerChange(nextBannerUrl: string | null) {
    setBannerUrl(nextBannerUrl);
    persistMetadata({ bannerUrl: nextBannerUrl });
  }

  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("File is too large (max 4MB)");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const res = await uploadFiles("coverBanner", {
        files: [file],
        input: { workspaceId: document.workspaceId },
      });
      const uploaded = res?.[0];
      const url = uploaded?.serverData?.url ?? uploaded?.url;
      if (!url) throw new Error("Upload failed: No URL returned");
      onBannerChange(url);
      toast.success("Cover banner updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload cover banner"
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const coverStyle = coverStyleForBannerUrl(bannerUrl);
  const isCustomBanner =
    bannerUrl && !documentCoverPresets.some((p) => p.id === bannerUrl);

  return (
    <div className="w-full">
      {coverStyle ?
        <div
          className="h-32 w-full bg-cover bg-center sm:h-48"
          style={{ backgroundImage: coverStyle }}
        />
      : null}

      <div className="mx-auto w-full max-w-3xl px-6 pb-2">
        <div className="flex items-center gap-2 pt-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2">
                  <HugeiconsIcon icon={ImageAdd02Icon} strokeWidth={2} />
                  Cover
                </Button>
              }
            />
            <PopoverContent align="start" className="w-72 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Cover banner</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ?
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      strokeWidth={2}
                      className="size-3.5 animate-spin"
                    />
                  : <HugeiconsIcon
                      icon={Upload01Icon}
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  }
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>

              {isCustomBanner ?
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Uploaded image
                  </p>
                  <div
                    className="h-16 w-full rounded-md border bg-cover bg-center ring-2 ring-ring"
                    style={{ backgroundImage: `url("${bannerUrl}")` }}
                  />
                </div>
              : null}

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={cn(
                      "h-14 rounded-md border text-xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      !bannerUrl && "ring-2 ring-ring"
                    )}
                    aria-pressed={!bannerUrl}
                    onClick={() => onBannerChange(null)}
                  >
                    None
                  </button>
                  {documentCoverPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      title={preset.label}
                      aria-label={preset.label}
                      aria-pressed={bannerUrl === preset.id}
                      className={cn(
                        "h-14 rounded-md border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        bannerUrl === preset.id && "ring-2 ring-ring"
                      )}
                      style={{ backgroundImage: preset.style }}
                      onClick={() => onBannerChange(preset.id)}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-start gap-3 pt-6">
          <EmojiPicker
            getValue={onIconChange}
            side="bottom"
            align="start"
            className="flex size-14 shrink-0 items-center justify-center rounded-md text-4xl hover:bg-muted"
            aria-label="Choose page icon"
          >
            {icon || "📄"}
          </EmojiPicker>

          <Textarea
            value={title}
            onChange={onTitleChange}
            rows={1}
            aria-label="Page title"
            placeholder="Untitled"
            className="min-h-14 resize-none border-none bg-transparent px-0 text-3xl font-bold shadow-none sm:text-4xl focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
