import { useAuth } from "@/provider/auth-context";
import type { Workspace } from "@/type";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { t } from "i18next";
import { SidebarNav } from "./sidebar-nav";
import {NAV_ITEMS } from "@/constants/navItems";

export const SidebarComponent = ({
  currentWorkspace,
}: {
  currentWorkspace: Workspace | null;
}) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    // Lấy workspaceId từ query string hiện tại hoặc từ currentWorkspace
    const searchParams = new URLSearchParams(location.search);
    const workspaceId = searchParams.get('workspaceId') || currentWorkspace?.id;
    
    if (workspaceId) {
      navigate(`/dashboard?workspaceId=${workspaceId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "md:w[80px]" : "md:w[240px]"
      )}
    >
      <div className="flex h-14 items-center justify-center border-b px-4 mb-4">
        <button 
          onClick={handleLogoClick}
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Wrench className="size-6 text-blue-600" />
              <span className="font-semibold text-lg hidden md:block">
                Project Manager
              </span>
            </div>
          )}
          {isCollapsed && <Wrench className="size-6 text-blue-600" />}
        </button>

        <Button
          variant={"ghost"}
          size = "icon"
          className="ml-auto hidden md:block justify-center"
          onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? (
            <ChevronsRight className="size-4" color="blue" />
          ) : (
            <ChevronsLeft className="size-4" color="blue"/>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
            <SidebarNav
            items  = {NAV_ITEMS}
            isCollapsed={isCollapsed}
            currentWorkspace={currentWorkspace}
            className={cn(isCollapsed && "items-center space-y-2")}
            />
      </ScrollArea>

      <div>
            <Button variant={"ghost"} size={isCollapsed ? "icon": "default"} onClick={() => {
              logout();
              navigate("/sign-in");
            }}>
                  <LogOut className={cn("size-4",isCollapsed ? "" : "mr-2")}/>
                  <span className="hidden mb:block">{t("header.signOut")}</span>
            </Button>
      </div>
    </div>
  );
};
