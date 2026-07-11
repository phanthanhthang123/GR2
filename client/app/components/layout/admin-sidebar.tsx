import { useAuth } from "@/provider/auth-context";
import type { Workspace } from "@/type";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Wrench,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { t } from "i18next";
import { SidebarNav } from "./sidebar-nav";
import { ADMIN_NAV_ITEMS } from "@/constants/navItems";
import { useUnreadChatCount } from "@/hooks/use-chat";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";

export const AdminSidebar = ({
  currentWorkspace,
  isOpen = false,
  onClose,
  isMobile = false,
}: {
  currentWorkspace: Workspace | null;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}) => {
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(location.search);
  const workspaceId = searchParams.get("workspaceId") || currentWorkspace?.id || null;
  const chatUnreadCount = useUnreadChatCount(workspaceId);

  useEffect(() => {
    const refreshUnread = () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    };
    refreshUnread();
  }, [queryClient]);

  const handleLogoClick = () => {
    navigate('/dashboard');
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        isMobile
          ? "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-900 bg-slate-950 text-slate-100 transition-transform duration-300 md:hidden"
          : "hidden md:flex flex-col border-r border-slate-900 bg-slate-950 text-slate-100 transition-all duration-300 sticky top-0 h-screen",
        isMobile
          ? (isOpen ? "translate-x-0" : "-translate-x-full")
          : (isCollapsed ? "md:w-[80px]" : "md:w-[240px]")
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-900 px-4 mb-4 shrink-0">
        <button 
          onClick={handleLogoClick}
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          {isMobile ? (
            <div className="flex items-center gap-2">
              <Wrench className="size-6 text-teal-400" />
              <span className="font-extrabold text-lg bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                MentorHub
              </span>
            </div>
          ) : (
            <>
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <Wrench className="size-6 text-teal-400" />
                  <span className="font-extrabold text-lg hidden md:block bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                    MentorHub
                  </span>
                </div>
              )}
              {isCollapsed && <Wrench className="size-6 text-teal-400" />}
            </>
          )}
        </button>
 
        {isMobile ? (
          onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-800/60"
              onClick={onClose}
            >
              <X className="size-5" />
            </Button>
          )
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden md:block justify-center text-slate-400 hover:text-white hover:bg-slate-800/60"
            onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? (
              <ChevronsRight className="size-4" color="#0d9488" />
            ) : (
              <ChevronsLeft className="size-4" color="#0d9488"/>
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <SidebarNav
          items={ADMIN_NAV_ITEMS}
          isCollapsed={isMobile ? false : isCollapsed}
          currentWorkspace={currentWorkspace}
          chatUnreadCount={chatUnreadCount}
          theme="admin"
          className={cn(!isMobile && isCollapsed && "items-center space-y-2")}
          onItemClick={isMobile ? onClose : undefined}
        />
      </ScrollArea>

      <div className="p-3 border-t border-slate-900">
        <Button
          variant="ghost"
          size={(!isMobile && isCollapsed) ? "icon" : "default"}
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/60"
          onClick={() => {
            logout();
            navigate("/sign-in");
            if (isMobile && onClose) {
              onClose();
            }
          }}
        >
          <LogOut className={cn("size-4", (!isMobile && isCollapsed) ? "" : "mr-2")} />
          {(!isMobile && isCollapsed) ? null : <span>{t("header.signOut")}</span>}
        </Button>
      </div>
    </div>
  );
};
