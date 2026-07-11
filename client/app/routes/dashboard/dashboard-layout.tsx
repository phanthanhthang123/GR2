import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { AdminHeader } from "@/components/layout/admin-header";
import { useAuth } from "@/provider/auth-context";
import { Loader } from "@/components/loader";
import { Outlet, useNavigate, useLocation, useLoaderData, useRevalidator, Navigate } from "react-router";
import type { Workspace } from "@/type";
import { SidebarComponent } from "@/components/layout/sidebar-component";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { postData } from "@/lib/fetch-utlis";
import { getChatSocket } from "@/hooks/use-chat";
import { useGetWorkspaceQueryById } from "@/hooks/use-workspace";
import { useProjectQueryById } from "@/hooks/use-project";
import { ChevronRight, Shield, Users2, Building2, Folder, Briefcase, ListCheck, MessagesSquare, Settings } from "lucide-react";

export const clientLoader = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
    if (!userInfo || !userInfo.id) {
      return { workspaces: [] };
    }
    const workspaces = await postData<Workspace[]>("/workspace/list-workspace-by-user", {user_id: userInfo.id});
    return { workspaces: workspaces || [] };
  } catch (error) {
    console.error("Error loading workspaces:", error);
    return { workspaces: [] };
  }
}

const DashBoardLayout = () => {
  const {isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const revalidator = useRevalidator();
  const { workspaces } = useLoaderData() as { workspaces: Workspace[] };
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  const pathname = location.pathname;
  const wsMatch = pathname.match(/\/workspaces\/([^/]+)/);
  const workspaceId = wsMatch ? wsMatch[1] : null;

  const projMatch = pathname.match(/\/workspaces\/[^/]+\/projects\/([^/]+)/);
  const projectId = projMatch ? projMatch[1] : null;

  const { data: workspaceDetail } = useGetWorkspaceQueryById(workspaceId || "") as any;
  const { data: projectDetail } = useProjectQueryById(projectId || "");

  // Refetch workspaces when user changes (after login)
  useEffect(() => {
    if (user && isAuthenticated && !isLoading) {
      // Check if workspaces need to be refetched
      // This will trigger when user logs in and navigates to dashboard
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      if (userInfo?.id && userInfo.id === user.id) {
        // Small delay to ensure everything is ready
        const timer = setTimeout(() => {
          revalidator.revalidate();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id, isAuthenticated, isLoading, revalidator]);

  // Load saved workspace from localStorage on mount and sync
  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      const workspace = workspaces.find((ws: Workspace) => ws.id === savedWorkspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
      } else {
        // Fallback to first workspace if saved one is not found or is invalid for this user
        setCurrentWorkspace(workspaces[0]);
        localStorage.setItem('selectedWorkspaceId', workspaces[0].id);
      }
    } else {
      setCurrentWorkspace(null);
      localStorage.removeItem('selectedWorkspaceId');
    }
  }, [workspaces]);

  // Sync currentWorkspace with URL params when on workspace page
  useEffect(() => {
    const pathMatch = location.pathname.match(/\/workspaces\/([^/]+)/);
    if (pathMatch && workspaces) {
      const workspaceId = pathMatch[1];
      const workspace = workspaces.find((ws: Workspace) => ws.id === workspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
        // Save to localStorage
        localStorage.setItem('selectedWorkspaceId', workspaceId);
      }
    }
    // Don't clear currentWorkspace when navigating away from workspace page
    // Keep the selected workspace visible in header
  }, [location.pathname, workspaces]);

  // Keep chat presence online across all dashboard pages
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const socket = getChatSocket();

    let lastEmit = 0;
    const emitHeartbeat = () => {
      const now = Date.now();
      if (now - lastEmit < 5000) return;
      lastEmit = now;
      socket.emit("presence:heartbeat");
    };

    emitHeartbeat();
    const interval = setInterval(emitHeartbeat, 30000);
    window.addEventListener("mousemove", emitHeartbeat);
    window.addEventListener("keydown", emitHeartbeat);
    window.addEventListener("click", emitHeartbeat);
    window.addEventListener("focus", emitHeartbeat);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", emitHeartbeat);
      window.removeEventListener("keydown", emitHeartbeat);
      window.removeEventListener("click", emitHeartbeat);
      window.removeEventListener("focus", emitHeartbeat);
    };
  }, [isAuthenticated, user?.id]);

  if(isLoading) {
    return <Loader/>
  }
  if(!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  // Bắt buộc đổi mật khẩu lần đầu nếu server đánh dấu mustChangePassword = true
  if (user?.mustChangePassword && location.pathname !== "/first-change-password") {
    return <Navigate to="/first-change-password" replace />;
  }

  const handleWorkspaceSelected = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    // Save to localStorage to persist across page refreshes
    localStorage.setItem('selectedWorkspaceId', workspace.id);
    // Navigate to workspace details page
    navigate(`/workspaces/${workspace.id}`);
  }
  const handleCreateWorkspace = () => {
    setIsCreatingWorkspace(true);
  }

  // pathname, workspaceId, projectId, workspaceDetail, projectDetail moved to the top of the component to follow rules of React Hooks.

  const renderIcon = (iconName: string) => {
    const props = { className: "size-4 mr-1.5 text-slate-500 shrink-0" };
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
        { label: 'Không Gian Làm Việc', path: '/workspaces', iconName: 'Building2' },
        { label: wsName, path: `/workspaces/${workspaceId}`, iconName: 'Folder' },
        { label: projName, path: `/workspaces/${workspaceId}/projects/${projectId}`, iconName: 'Briefcase' },
        { label: 'Chi Tiết Task', path: null, iconName: 'ListCheck' }
      ];
    }
    if (pathname.match(/^\/workspaces\/[^/]+\/projects\/[^/]+$/)) {
      return [
        { label: 'Không Gian Làm Việc', path: '/workspaces', iconName: 'Building2' },
        { label: wsName, path: `/workspaces/${workspaceId}`, iconName: 'Folder' },
        { label: projName, path: null, iconName: 'Briefcase' }
      ];
    }
    if (pathname.match(/^\/workspaces\/[^/]+$/)) {
      return [
        { label: 'Không Gian Làm Việc', path: '/workspaces', iconName: 'Building2' },
        { label: wsName, path: null, iconName: 'Folder' }
      ];
    }

    const pathMap: Record<string, { label: string; iconName: string }> = {
      '/dashboard': { label: 'Bảng Điều Khiển', iconName: 'Shield' },
      '/workspaces': { label: 'Không Gian Làm Việc', iconName: 'Building2' },
      '/my-tasks': { label: 'Task Của Tôi', iconName: 'ListCheck' },
      '/achieved': { label: 'Đã Hoàn Thành', iconName: 'ListCheck' },
      '/chat': { label: 'Chat', iconName: 'MessagesSquare' },
      '/settings': { label: 'Cài Đặt', iconName: 'Settings' },
      '/accounts': { label: 'Quản Lý Tài Khoản', iconName: 'Users2' },
    };

    for (const [path, info] of Object.entries(pathMap)) {
      if (pathname === path || pathname.startsWith(path + '/')) {
        return [{ label: info.label, path: null, iconName: info.iconName }];
      }
    }
    return [];
  };

  const breadcrumbsList = buildBreadcrumb();

  const isFixedViewportRoute =
    location.pathname === "/chat" ||
    location.pathname === "/settings" ||
    location.pathname === "/my-tasks";

  const isAdmin = user?.role === "Admin";

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* Desktop Sidebar Component */}
      {isAdmin ? (
        <AdminSidebar currentWorkspace={currentWorkspace} />
      ) : (
        <SidebarComponent currentWorkspace={currentWorkspace} />
      )}
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Component */}
      {isAdmin ? (
        <AdminSidebar 
          currentWorkspace={currentWorkspace}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isMobile
        />
      ) : (
        <SidebarComponent 
          currentWorkspace={currentWorkspace}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isMobile
        />
      )}

      <div className="flex flex-1 flex-col h-full min-w-0">
        {/* Header */}
        {isAdmin ? (
          <AdminHeader onMenuToggle={() => setIsMobileSidebarOpen(true)} />
        ) : (
          <Header
            onWorkspaceSelected = {(workspace) => handleWorkspaceSelected(workspace)}
            selectedWorkspace = {currentWorkspace}
            onCreateWorkspace = {() => setIsCreatingWorkspace(true)}
            onMenuToggle = {() => setIsMobileSidebarOpen(true)}
          />
        )}
        {/* Chỉ content được scroll; sidebar cố định */}
        <main
          className={`flex-1 w-full ${
            isFixedViewportRoute ? "overflow-hidden p-0" : "overflow-y-auto p-4"
          }`}
        >
          <div
            className={`mx-auto container w-full min-w-0 ${
              isFixedViewportRoute ? "h-full px-2 sm:px-4 lg:px-6 py-2 flex flex-col" : "px-2 sm:px-6 lg:px-8 py-0 md:py-8"
            }`}
          >
            {!isAdmin && breadcrumbsList.length > 0 && (
              <div className={`${isFixedViewportRoute ? "mb-3 shrink-0" : "mb-6"} px-1`}>
                <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 bg-slate-50/70 border border-slate-100/80 rounded-lg py-2 px-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] w-fit backdrop-blur-sm">
                  {breadcrumbsList.map((item, index) => {
                    const isLast = index === breadcrumbsList.length - 1;
                    return (
                      <span key={index} className="flex items-center gap-1.5">
                        {index > 0 && <ChevronRight className="size-3.5 text-slate-400" />}
                        {isLast ? (
                          <span className="text-slate-800 font-semibold flex items-center">
                            {renderIcon(item.iconName)}
                            {item.label}
                          </span>
                        ) : item.path ? (
                          <button
                            type="button"
                            onClick={() => navigate(item.path!)}
                            className="hover:text-slate-900 hover:underline transition-colors cursor-pointer text-slate-500 font-medium flex items-center"
                          >
                            {renderIcon(item.iconName)}
                            {item.label}
                          </button>
                        ) : (
                          <span className="text-slate-500 font-medium flex items-center">
                            {renderIcon(item.iconName)}
                            {item.label}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </nav>
              </div>
            )}
            <div className={isFixedViewportRoute ? "flex-1 min-h-0" : ""}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <CreateWorkspace 
        isCreatingWorkspace = {isCreatingWorkspace}
        setIsCreatingWorkspace = {setIsCreatingWorkspace}
      />
    </div>
  );
};

export default DashBoardLayout;
