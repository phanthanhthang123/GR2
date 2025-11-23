import { LayoutDashboard, User, ListCheck, CheckCircle2, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Workspaces",
    href: "/workspaces",
    icon: User,
  },
  {
    title: "My Tasks",
    href: "/my-tasks",
    icon: ListCheck,
  },
  {
    title: "Achieved",
    href: "/achieved",
    icon: CheckCircle2,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
