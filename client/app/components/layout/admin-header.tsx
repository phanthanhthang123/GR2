import { useAuth } from "@/provider/auth-context";
import type { AppNotification } from "@/type";
import { Button } from "../ui/button";
import { useLocation, useNavigate } from "react-router";
import { Bell, LogOut, Settings, Menu, ChevronRight, Shield, Users2, Building2, Folder, Briefcase, ListCheck, MessagesSquare } from "lucide-react";
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
import { Badge } from "../ui/badge";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useMyNotificationsQuery,
} from "@/hooks/use-notification";
import { useGetWorkspaceQueryById } from "@/hooks/use-workspace";
import { useProjectQueryById } from "@/hooks/use-project";
import React from "react";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export const AdminHeader = ({
  onMenuToggle,
}: AdminHeaderProps) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: notificationData } = useMyNotificationsQuery(12);
  const { mutate: markAsRead } = useMarkNotificationReadMutation();
  const { mutate: markAllAsRead } = useMarkAllNotificationsReadMutation();

  const pathname = location.pathname;
  const wsMatch = pathname.match(/\/workspaces\/([^/]+)/);
  const workspaceId = wsMatch ? wsMatch[1] : null;

  const projMatch = pathname.match(/\/workspaces\/[^/]+\/projects\/([^/]+)/);
  const projectId = projMatch ? projMatch[1] : null;

  const { data: workspaceDetail } = useGetWorkspaceQueryById(workspaceId || "") as any;
  const { data: projectDetail } = useProjectQueryById(projectId || "");

  const getLastNameInitial = (username: string) => {
    if (!username || username.trim() === "") return "";
    const names = username.trim().split(" ").filter(name => name.length > 0);
    if (names.length === 0) return "";
    const lastName = names[names.length - 1];
    return lastName.charAt(0).toUpperCase();
  };

  const renderIcon = (iconName: string) => {
    const props = { className: "size-4 mr-1.5 text-teal-600 dark:text-teal-400 shrink-0" };
    switch (iconName) {
      case 'Shield': return <Shield {...props} />;
      case 'Users2': return <Users2 {...props} />;
      case 'Building2': return <Building2 {...props} />;
      case 'Folder': return <Folder {...props} />;
      case 'Briefcase': return <Briefcase {...props} />;
      case 'ListCheck': return <ListCheck {...props} />;
      case 'MessagesSquare': return <MessagesSquare {...props} />;
      case 'Settings': return <Settings {...props} />;
      default: return null;
    }
  };

  const buildBreadcrumb = () => {
    const wsName = workspaceDetail?.name ? `Chi tiết workspace (${workspaceDetail.name})` : 'Chi Tiết Workspace';
    const projName = projectDetail?.project?.name || 'Chi Tiết Dự Án';

    if (pathname.match(/^\/workspaces\/[^/]+\/projects\/[^/]+\/tasks\/[^/]+$/)) {
      return [
        { label: 'Tất Cả Workspace', path: '/workspaces', iconName: 'Building2' },
        { label: wsName, path: `/workspaces/${workspaceId}`, iconName: 'Folder' },
        { label: projName, path: `/workspaces/${workspaceId}/projects/${projectId}`, iconName: 'Briefcase' },
        { label: 'Chi Tiết Task', path: null, iconName: 'ListCheck' }
      ];
    }
    if (pathname.match(/^\/workspaces\/[^/]+\/projects\/[^/]+$/)) {
      return [
        { label: 'Tất Cả Workspace', path: '/workspaces', iconName: 'Building2' },
        { label: wsName, path: `/workspaces/${workspaceId}`, iconName: 'Folder' },
        { label: projName, path: null, iconName: 'Briefcase' }
      ];
    }
    if (pathname.match(/^\/workspaces\/[^/]+$/)) {
      return [
        { label: 'Tất Cả Workspace', path: '/workspaces', iconName: 'Building2' },
        { label: wsName, path: null, iconName: 'Folder' }
      ];
    }

    const pathMap: Record<string, { label: string; iconName: string }> = {
      '/dashboard': { label: 'Tổng Quan Hệ Thống', iconName: 'Shield' },
      '/accounts': { label: 'Quản Lý Tài Khoản', iconName: 'Users2' },
      '/workspaces': { label: 'Tất Cả Workspace', iconName: 'Building2' },
      '/chat': { label: 'Chat', iconName: 'MessagesSquare' },
      '/settings': { label: 'Cài Đặt', iconName: 'Settings' },
    };

    for (const [path, info] of Object.entries(pathMap)) {
      if (pathname === path || pathname.startsWith(path + '/')) {
        return [{ label: info.label, path: null, iconName: info.iconName }];
      }
    }
    return [{ label: 'Hệ thống', path: null, iconName: 'Shield' }];
  };

  const breadcrumbsList = buildBreadcrumb();

  const getNotificationAgoText = (createdAt: string | Date) => {
    const time = new Date(createdAt).getTime();
    const diffMs = Date.now() - time;
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const notifications = notificationData?.response || [];
  const unreadCount = notificationData?.unreadCount || 0;

  const handleOpenNotification = (notification: AppNotification) => {
    if (notification.is_read !== "TRUE") {
      markAsRead(notification.id);
    }
    const payload = notification.payload as any;
    if (payload?.type === "task" && payload?.taskId && payload?.projectId) {
      const workspaceIdFromPayload = payload?.workspaceId || localStorage.getItem("selectedWorkspaceId");
      if (workspaceIdFromPayload) {
        navigate(`/workspaces/${workspaceIdFromPayload}/projects/${payload.projectId}/tasks/${payload.taskId}`);
        return;
      }
    }
    navigate("/chat");
  };

  return (
    <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-teal-500/10">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Left: Menu toggle + Breadcrumb */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <nav className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            {breadcrumbsList.map((item, index) => {
              const isLast = index === breadcrumbsList.length - 1;
              return (
                <span key={index} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="size-3 text-slate-400" />}
                  {isLast ? (
                    <span className="text-foreground font-semibold flex items-center">
                      {renderIcon(item.iconName)}
                      {item.label}
                    </span>
                  ) : item.path ? (
                    <button
                      type="button"
                      onClick={() => navigate(item.path!)}
                      className="hover:text-foreground hover:underline transition-colors cursor-pointer flex items-center"
                    >
                      {renderIcon(item.iconName)}
                      {item.label}
                    </button>
                  ) : (
                    <span className="flex items-center">
                      {renderIcon(item.iconName)}
                      {item.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-bold border-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] max-h-[420px] overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Thông báo</DropdownMenuLabel>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => markAllAsRead()}
                  disabled={unreadCount === 0}
                >
                  Đánh dấu tất cả đã đọc
                </Button>
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">Chưa có thông báo nào</div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="cursor-pointer py-2.5 px-3 flex flex-col items-start gap-1"
                    onClick={() => handleOpenNotification(notification)}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <p
                        className={`text-xs leading-5 ${
                          notification.is_read === "TRUE" ? "text-muted-foreground" : "font-medium"
                        }`}
                      >
                        {notification.message}
                      </p>
                      {notification.is_read !== "TRUE" && (
                        <span className="mt-1 size-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {getNotificationAgoText(notification.createdAt)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full border p-1 w-8 h-8 flex items-center justify-center">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={user?.avatarUrl || undefined}
                    alt={user?.username || "Admin"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getLastNameInitial(user?.username || "") || "A"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("header.myAccount")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link to="/settings" className="flex items-center w-full cursor-pointer">
                <DropdownMenuItem className="flex items-center w-full cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" /> {t("header.profile")}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                logout();
                navigate("/sign-in");
              }}>
                <LogOut className="w-4 h-4 mr-2" /> {t("header.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
