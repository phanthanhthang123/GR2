import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/provider/auth-context";
import { Loader } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import type { Workspace } from "@/type";
import { set } from "zod";
import { SidebarComponent } from "@/components/layout/sidebar-component";

const DashBoardLayout = () => {
  const {isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  if(isLoading) {
    return <Loader/>
  }
  if(!isAuthenticated) {
    return navigate("/sign-in");
  }

  const handleWorkspaceSelected = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
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
          onWorkspaceSelected = {() => {handleWorkspaceSelected}}
          selectedWorkspace = {currentWorkspace}
          onCreateWorkspace = {() => setIsCreatingWorkspace(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 h-full w-full">
          <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
            <Outlet />
            </div>
        </main>
      </div>
    </div>
  );
};

export default DashBoardLayout;
