import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/provider/auth-context";
import { Loader } from "@/components/loader";
import { Outlet, useNavigate, useLocation, useLoaderData, useRevalidator } from "react-router";
import type { Workspace } from "@/type";
import { SidebarComponent } from "@/components/layout/sidebar-component";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { postData } from "@/lib/fetch-utlis";

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
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

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

  // Load saved workspace from localStorage on mount
  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
    if (savedWorkspaceId && workspaces) {
      const workspace = workspaces.find((ws: Workspace) => ws.id === savedWorkspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
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

  if(isLoading) {
    return <Loader/>
  }
  if(!isAuthenticated) {
    return navigate("/sign-in");
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

  return (
    <div className="flex h-screen w-full">
      {/* <Sidebar Components */}
      <SidebarComponent currentWorkspace={currentWorkspace}/>
      <div className="flex flex-1 flex-col h-full">
        {/* Header */}
        <Header
          onWorkspaceSelected = {(workspace) => handleWorkspaceSelected(workspace)}
          selectedWorkspace = {currentWorkspace}
          onCreateWorkspace = {() => setIsCreatingWorkspace(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 h-full w-full">
          <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
            <Outlet />
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
