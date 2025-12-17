import { useAuth } from "@/provider/auth-context";
import type { Workspace } from "@/type";
import React, { use } from "react";
import { Button } from "../ui/button";
import { useLoaderData, useLocation, useNavigate } from "react-router";
import { Bell, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { WorkspaceAvatar } from "../workspace/workspace-avatar";
import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";

interface HeaderProps {
  onWorkspaceSelected?: (workspace: Workspace) => void;
  selectedWorkspace?: Workspace | null;
  onCreateWorkspace?: () => void;
}

export const Header = ({
  onWorkspaceSelected,
  selectedWorkspace,
  onCreateWorkspace,
}: HeaderProps) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const getLastNameInitial = (username: string) => {
    if (!username || username.trim() === "") return "";
    const names = username.trim().split(" ").filter(name => name.length > 0);
    if (names.length === 0) return "";
    const lastName = names[names.length - 1];
    return lastName.charAt(0).toUpperCase();
  };
  const loaderData = useLoaderData() as { workspaces?: Workspace[] };
  const workspaces = loaderData?.workspaces || [];
  // console.log(workspaces)

  const isOnWorkspacePage = useLocation().pathname.includes('/workspaces');
  const navigate = useNavigate();

  // Check if user has permission to create workspace (Admin or Leader)
  const canCreateWorkspace = user?.role === 'Admin' || user?.role === 'Leader';

  const handleOnClickWorkspace = (ws: Workspace) => {
    onWorkspaceSelected && onWorkspaceSelected(ws);
    const location = window.location;
    if(isOnWorkspacePage) {
      location.href = `/workspaces/${ws.id}`;
    } else {
      const basePath = location.pathname;
      navigate(`${basePath}?workspaceId=${ws.id}`);
    }
  }
  return (
    <div className="bg-background sticky top-0 z-40 border-b">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={"outline"}>
              {selectedWorkspace ? (
                <>
                  {selectedWorkspace.color && (
                    <WorkspaceAvatar
                      color={selectedWorkspace.color}
                      name={selectedWorkspace.name}
                    />
                  )}
                  <span className="font-medium">{selectedWorkspace?.name}</span>
                </>
              ) : (
                <span className="font-medium">
                  {t("header.selectWorkspace")}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuLabel>{t("header.workspaces")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {workspaces?.map((ws: any) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => handleOnClickWorkspace(ws)}
                >
                  {ws.color && (
                    <WorkspaceAvatar color={ws.color} name={ws.name} />
                  )}
                  <span className="ml-2">{ws.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            {canCreateWorkspace && (
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onCreateWorkspace}>
                    <PlusCircle className="w-4 h-4 mr-2"/> {t("header.createWorkspace")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}

          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full border p-1 w-8 h-8">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={user?.avatarUrl || ""}
                    alt={user?.username || "User"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getLastNameInitial(user?.username || "") || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("header.myAccount")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to="/user/profile">{t("header.profile")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
              logout();
              navigate("/sign-in");
            }}>
                {t("header.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
