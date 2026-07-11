import { cn } from "@/lib/utils";
import type { Workspace } from "@/type";
import {type LucideIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
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
  chatUnreadCount?: number;
  className?: string;
  onItemClick?: () => void;
  theme?: "admin" | "user";
}

export const SidebarNav = ({
  items,
  isCollapsed,
  className,
  currentWorkspace,
  chatUnreadCount = 0,
  onItemClick,
  theme = "user",
  ...props
}: SidebarNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  
  // Reset clickedHref when location changes (navigation completed)
  useEffect(() => {
    setClickedHref(null);
  }, [location.pathname]);
  
  const isAdmin = theme === "admin";
  
  return (
    <nav className={cn("flex flex-col gap-y-2", className)} {...props}>
      {items.map((el) => {
        const Icon = el.icon;
        // Check if current pathname matches the nav item
        // Match exact path or paths that start with href + "/"
        const isActiveByPath = location.pathname === el.href || 
                               location.pathname.startsWith(el.href + "/");
        // Also check if this item was just clicked (for immediate visual feedback)
        const isActive = isActiveByPath || clickedHref === el.href;
        
        const handleMouseDown = () => {
          // Set clicked state on mousedown for immediate visual feedback
          setClickedHref(el.href);
        };
        
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
          // Ensure clicked state is set
          setClickedHref(el.href);
          
          if (el.href === "/workspaces") {
            navigate(el.href);
          } else if (currentWorkspace && currentWorkspace.id) {
            navigate(`${el.href}?workspaceId=${currentWorkspace.id}`);
          } else {
            navigate(el.href);
          }
          // Blur button after click to remove focus state
          e.currentTarget.blur();
          onItemClick?.();
        };
        const isChatItem = el.href === "/chat";
        const showBadge = isChatItem && chatUnreadCount > 0;
        const chatBadgeText = chatUnreadCount > 99 ? "99+" : String(chatUnreadCount);

        return <Button key={el.href}
        variant={isActive ? "outline" : "ghost"}
        data-active={isActive}
        className={cn(
          "justify-start transition-all duration-200 border-none font-medium",
          isAdmin 
            ? isActive 
              ? "!bg-teal-600 !text-white hover:!bg-teal-600 focus-visible:!bg-teal-600 shadow-sm shadow-teal-900/20" 
              : "text-slate-300 hover:text-white hover:bg-slate-800/60 focus-visible:bg-slate-800/60"
            : isActive 
              ? "!bg-blue-800/20 !text-blue-600 hover:!bg-blue-800/20 hover:!text-blue-600 focus-visible:!bg-blue-800/20 focus-visible:!text-blue-600" 
              : ""
        )}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        >
            <Icon className={cn("mr-2 size-4 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
            {isCollapsed ? (
              <span className="sr-only">{el.title}</span>
            ) : (
              <span className="flex items-center justify-between w-full">
                <span>{el.title}</span>
                {showBadge ? (
                  <span className="ml-2 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] leading-5 text-center font-bold">
                    {chatBadgeText}
                  </span>
                ) : null}
              </span>
            )}
        </Button>;
      })}
    </nav>
  );
};
