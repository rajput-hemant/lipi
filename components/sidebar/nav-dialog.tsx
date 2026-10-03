import { HugeiconsIcon } from "@hugeicons/react";

import type { IconSvgElement } from "@hugeicons/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

type NavDialogProps = {
  title: string;
  description: string;
  icon: IconSvgElement;
  children?: React.ReactNode;
};

export function NavDialog(props: NavDialogProps) {
  const { title, description, icon, children } = props;

  return (
    <SidebarMenuItem>
      <Dialog>
        <SidebarMenuButton tooltip={title} render={<DialogTrigger />}>
          <HugeiconsIcon icon={icon} strokeWidth={2} />
          <span>{title}</span>
        </SidebarMenuButton>

        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center font-heading text-xl [text-shadow:_0_4px_0_#e1e1e1] dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent dark:[text-shadow:none] md:text-3xl">
              <HugeiconsIcon
                icon={icon}
                strokeWidth={2}
                className="mb-1 mr-2 size-7"
              />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {children}
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  );
}
