"use client";

import React from "react";
import { ImageAdd02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { EmojiPicker } from "@/components/emoji-picker";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  coverStyleForBannerUrl,
  documentCoverPresets,
} from "@/lib/block-editor/cover-presets";
import { useDebouncedCallback } from "@/lib/block-editor/use-debounced-callback";
import { updateDocumentInDb } from "@/lib/db/queries";
import { useAppState } from "@/hooks/use-app-state";
import { cn } from "@/lib/utils";

type DocumentHeaderProps = {
  documentId: string;
};

export function DocumentHeader({ documentId }: DocumentHeaderProps) {
  const { documents, updateDocument: updateDocumentState } = useAppState();
  const document = documents.find((entry) => entry.id === documentId);

  const [title, setTitle] = React.useState(document?.title ?? "");
  const [icon, setIcon] = React.useState(document?.icon ?? "");
  const [bannerUrl, setBannerUrl] = React.useState(document?.bannerUrl ?? null);

  const persistMetadata = useDebouncedCallback(
    async (patch: {
      title?: string;
      icon?: string;
      bannerUrl?: string | null;
    }) => {
      try {
        const updated = await updateDocumentInDb({
          id: documentId,
          ...patch,
        });
        updateDocumentState(updated);
      } catch {
        toast.error("Could not save document details.");
      }
    },
    500,
  );

  if (!document) {
    return null;
  }

  function onTitleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);

    const trimmed = nextTitle.trim();
    if (trimmed.length < 1) {
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

  const coverStyle = coverStyleForBannerUrl(bannerUrl);

  return (
    <div className="w-full">
      {coverStyle ? (
        <div
          className="h-48 w-full bg-cover bg-center"
          style={{ backgroundImage: coverStyle }}
        />
      ) : null}

      <div className="mx-auto w-full max-w-3xl px-6 pb-2">
        <div className="flex items-center gap-2 pt-4">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2">
                  <HugeiconsIcon icon={ImageAdd02Icon} strokeWidth={2} />
                  Cover
                </Button>
              }
            />
            <PopoverContent align="start" className="w-72">
              <p className="mb-2 text-sm font-medium">Cover banner</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    "h-16 rounded-md border text-xs text-muted-foreground",
                    !bannerUrl && "ring-2 ring-ring",
                  )}
                  onClick={() => onBannerChange(null)}
                >
                  None
                </button>
                {documentCoverPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.label}
                    className={cn(
                      "h-16 rounded-md border",
                      bannerUrl === preset.id && "ring-2 ring-ring",
                    )}
                    style={{ backgroundImage: preset.style }}
                    onClick={() => onBannerChange(preset.id)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-start gap-3 pt-6">
          <EmojiPicker getValue={onIconChange} side="bottom" align="start">
            <button
              type="button"
              className="flex size-14 shrink-0 items-center justify-center rounded-md text-4xl hover:bg-muted"
              aria-label="Choose page icon"
            >
              {icon || "📄"}
            </button>
          </EmojiPicker>

          <Textarea
            value={title}
            onChange={onTitleChange}
            rows={1}
            placeholder="Untitled"
            className="min-h-14 resize-none border-none bg-transparent px-0 text-4xl font-bold shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
