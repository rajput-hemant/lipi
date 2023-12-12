import Link from "next/link";
import { File, Folder } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { buttonVariants } from "../ui/button";

export async function FolderAccordion() {
  return (
    <Accordion type="multiple" className="px-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <AccordionItem
          key={i}
          value={`folder-${i}`}
          className="my-0.5 border-none"
        >
          <AccordionTrigger
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "justify-start border-none hover:no-underline data-[state=open]:bg-secondary"
            )}
          >
            <Folder className="mr-2 h-4 w-4 shrink-0" />
            Folder {i + 1}
          </AccordionTrigger>

          <AccordionContent className="pl-2 pt-1">
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
