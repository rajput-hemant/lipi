"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { BlockEditorSchema } from "./editor-schema";

const calloutSlashIcon = (
  <HugeiconsIcon
    icon={InformationCircleIcon}
    strokeWidth={2}
    className="size-[18px]"
  />
);

export function insertCalloutSlashMenuItem(
  editor: BlockNoteEditor<
    BlockEditorSchema["blockSchema"],
    BlockEditorSchema["inlineContentSchema"],
    BlockEditorSchema["styleSchema"]
  >,
) {
  return {
    title: "Callout",
    subtext: "Emphasize text with a colored callout",
    onItemClick: () =>
      insertOrUpdateBlockForSlashMenu(editor, {
        type: "alert",
      }),
    aliases: [
      "callout",
      "alert",
      "notification",
      "warning",
      "error",
      "info",
      "success",
    ],
    group: "Basic blocks",
    icon: calloutSlashIcon,
  };
}

export const calloutBlockTypeSelectItem = {
  name: "Callout",
  type: "alert",
  icon: () => calloutSlashIcon,
};
