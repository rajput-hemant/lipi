"use client";

import dynamic from "next/dynamic";
import { Theme, type EmojiClickData } from "emoji-picker-react";
import { useTheme } from "next-themes";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const Picker = dynamic(() => import("emoji-picker-react"));

type EmojiPickerProps = React.HTMLAttributes<HTMLButtonElement> & {
  getValue?: (emoji: string) => void;
  children: React.ReactNode;
};

export function EmojiPicker({ getValue, ...props }: EmojiPickerProps) {
  const { resolvedTheme } = useTheme();

  function onEmojiClick({ emoji }: EmojiClickData) {
    if (getValue) getValue(emoji);
  }

  return (
    <Popover>
      <PopoverTrigger {...props}>{props.children}</PopoverTrigger>

      <PopoverContent className="border-none p-0">
        <Picker
          theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
          onEmojiClick={onEmojiClick}
        />
      </PopoverContent>
    </Popover>
  );
}
