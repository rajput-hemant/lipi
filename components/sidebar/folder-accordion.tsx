"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, File, FolderIcon, FolderOpen } from "lucide-react";

import type { Folder } from "@/types/db";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { buttonVariants } from "../ui/button";

type FolderAccordionProps = {
  folders: Folder[];
};

export function FolderAccordion({ folders }: FolderAccordionProps) {
  const [openedFolders, setOpenedFolders] = React.useState<string[]>([]);

  return (
    <Accordion
      type="multiple"
      value={folders.map(({ id }) => id!)}
      onValueChange={setOpenedFolders}
      className="px-4"
    >
      {folders.map(({ id, title }) => (
        <AccordionItem key={id} value={id!} className="my-px border-none">
          <AccordionTrigger
            showIndicator={false}
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "justify-start border-none hover:no-underline data-[state=open]:bg-secondary"
            )}
          >
            {openedFolders.includes(id!) ? (
              <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
            ) : (
              <FolderIcon className="mr-2 h-4 w-4 shrink-0" />
            )}
            {title}
            <ChevronDown className="invisible ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-hover/trigger:visible group-data-[state=open]/trigger:visible group-data-[state=open]/trigger:rotate-180" />
          </AccordionTrigger>

          <AccordionContent className="pb-2 pl-2 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Link
                key={i}
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "w-full justify-start"
                )}
              >
                <File className="mr-2 h-4 w-4 shrink-0" />
                File {i + 1}
              </Link>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
