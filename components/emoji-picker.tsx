"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import type { EmojiClickData, Theme } from "emoji-picker-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const Picker = dynamic(() => import("emoji-picker-react"));

type EmojiPickerProps = React.HTMLAttributes<HTMLSpanElement> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "center" | "start" | "end";
  getValue?: (emoji: string) => void;
  children: React.ReactNode;
};

export function EmojiPicker(props: EmojiPickerProps) {
  const { side, align, getValue, children, className, ...restProps } = props;

  const { resolvedTheme } = useTheme();

  function onEmojiClick({ emoji }: EmojiClickData) {
    if (getValue) getValue(emoji);
  }

  return (
    <Popover>
      <PopoverTrigger
        nativeButton={false}
        render={
          <span
            className={cn(
              "inline-flex cursor-pointer items-center justify-center",
              className
            )}
            {...restProps}
          />
        }
      >
        {children}
      </PopoverTrigger>

      <PopoverContent side={side} align={align} className="border-none p-0">
        <Picker theme={resolvedTheme as Theme} onEmojiClick={onEmojiClick} />
      </PopoverContent>
    </Popover>
  );
}
