import { cn } from "@/lib/utils";
import type { Workspace } from "@/type";
import {type LucideIcon } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { useLocation, useNavigate } from "react-router";

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string;
    href: string;
    icon: LucideIcon;
  }[];
  isCollapsed: boolean;
  currentWorkspace: Workspace | null;
  className?: string;
}

export const SidebarNav = ({
  items,
  isCollapsed,
  className,
  currentWorkspace,
  ...props
}: SidebarNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
      console.log(location.pathname);
  return (
    <nav className={cn("flex flex-col gap-y-2", className)} {...props}>
      {items.map((el) => {
        const Icon = el.icon;
        const isActive = location.pathname === el.href;
        console.log("pathname:", location.pathname, "el.href:", el.href, "isActive:", isActive);
        const handleClick = () => {
          if (el.href === "/workspaces") {
            navigate(el.href);
          } else if (currentWorkspace && currentWorkspace.id) {
            navigate(`${el.href}?workspaceId=${currentWorkspace.id}`);
          } else {
            navigate(el.href);
          }
        };
        return <Button key={el.href}
        variant={isActive ? "outline" : "ghost"}
        className={cn("justify-start", isActive && "bg-blue-800/20 text-blue-600 font-medium")}
        onClick={handleClick}
        >
            <Icon className="mr-2 size-4"/>
            {
                  isCollapsed ? (<span className="sr-only">{el.title}</span>) :(el.title)
            }
        </Button>;
      })}
    </nav>
  );
};
