"use client";

import dynamic from "next/dynamic";
import { Theme, type EmojiClickData } from "emoji-picker-react";
import { useTheme } from "next-themes";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const Picker = dynamic(() => import("emoji-picker-react"));

type EmojiPickerProps = {
  children: React.ReactNode;
  getValue?: (emoji: string) => void;
};

export function EmojiPicker({ children, getValue }: EmojiPickerProps) {
  const { theme } = useTheme();

  function onEmojiClick({ emoji }: EmojiClickData) {
    if (getValue) getValue(emoji);
  }

  return (
    <Popover>
      <PopoverTrigger>{children}</PopoverTrigger>

      <PopoverContent className="border-none p-0">
        <Picker
          theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
          onEmojiClick={onEmojiClick}
        />
      </PopoverContent>
    </Popover>
  );
}
