import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type NavDialogProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  isCollapsed?: boolean;
  children?: React.ReactNode;
};

export function NavDialog(props: NavDialogProps) {
  const { title, description, icon: Icon, isCollapsed, children } = props;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={isCollapsed ? "icon" : "sm"}
          variant="ghost"
          className={cn(!isCollapsed && "w-full justify-start")}
        >
          <Icon
            className={cn(isCollapsed ? "size-5" : "mr-2 size-4 shrink-0")}
          />
          {!isCollapsed && title}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center font-heading text-xl [text-shadow:_0_4px_0_#e1e1e1] dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent dark:[text-shadow:none] md:text-3xl">
            <Icon className="mb-1 mr-2 size-7" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}
