"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import type { EmojiClickData, Theme } from "emoji-picker-react";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const Picker = dynamic(() => import("emoji-picker-react"));

type EmojiPickerProps = React.HTMLAttributes<HTMLButtonElement> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "center" | "start" | "end";
  getValue?: (emoji: string) => void;
  children: React.ReactNode;
};

export function EmojiPicker(props: EmojiPickerProps) {
  const { side, align, getValue, children, ...restProps } = props;

  const { resolvedTheme } = useTheme();

  function onEmojiClick({ emoji }: EmojiClickData) {
    if (getValue) getValue(emoji);
  }

  return (
    <Popover>
      <PopoverTrigger {...restProps}>{children}</PopoverTrigger>

      <PopoverContent side={side} align={align} className="border-none p-0">
        <Picker theme={resolvedTheme as Theme} onEmojiClick={onEmojiClick} />
      </PopoverContent>
    </Popover>
  );
}
