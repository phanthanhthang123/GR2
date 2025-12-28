import { LayoutDashboard, User, ListCheck, CheckCircle2, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Bảng Điều Khiển",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Không Gian Làm Việc",
    href: "/workspaces",
    icon: User,
  },
  {
    title: "Task Của Tôi",
    href: "/my-tasks",
    icon: ListCheck,
  },
  {
    title: "Đã Hoàn Thành",
    href: "/achieved",
    icon: CheckCircle2,
  },
  {
    title: "Cài Đặt",
    href: "/settings",
    icon: Settings,
  },
];
