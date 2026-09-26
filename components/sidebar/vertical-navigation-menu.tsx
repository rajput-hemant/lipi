import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";

import { NavigationMenuPositioner } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function VerticalNavigationMenu({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Root.Props) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-orientation="vertical"
      orientation="vertical"
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
      <NavigationMenuPositioner align="start" side="right" />
    </NavigationMenuPrimitive.Root>
  );
}

export const verticalNavigationMenuListClassName =
  "group-data-[orientation=vertical]/navigation-menu:flex-col";
