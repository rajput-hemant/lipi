import type { ShadCNComponents } from "@blocknote/shadcn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const lipiBlockNoteShadcnComponents: Partial<ShadCNComponents> = {
  Avatar: {
    Avatar,
    AvatarFallback,
    AvatarImage,
  },
  Badge: {
    Badge,
  },
  Button: {
    Button,
  },
  Card: {
    Card,
    CardContent,
  },
  DropdownMenu: {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
  },
  Input: {
    Input,
  },
  Label: {
    Label,
  },
  Popover: {
    Popover,
    PopoverContent,
    PopoverTrigger,
  },
  Select: {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  },
  Skeleton: {
    Skeleton,
  },
  Tabs: {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  },
  Toggle: {
    Toggle,
  },
  Tooltip: {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  },
};
