import type { User, Workspace } from "@/type";
import React, { useMemo, useState } from "react";
import { WorkspaceAvatar } from "./workspace-avatar";
import { Button } from "../ui/button";
import { Plus, UserPlus } from "lucide-react";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/provider/auth-context";
import { WorkspaceMembersDialog } from "./workspace-members-dialog";

const WorkspaceHeader = (workspace: any) => {
  const workspaceData: Workspace = workspace.workspace;
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  
  const getLastNameInitial = (username: string) => {
    if (!username || username.trim() === "") return "";
    const names = username.trim().split(" ").filter(name => name.length > 0);
    if (names.length === 0) return "";
    const lastName = names[names.length - 1];
    return lastName.charAt(0).toUpperCase();
  };
  
  // Check if current user is Leader in this workspace
  // Only check if both user and workspaceData are loaded
  const isCurrentUserLeader = useMemo(() => {
    if (isAuthLoading || !user || !workspaceData) return false;
    
    // Check if user is owner
    if (workspaceData.onwner === user.id || (typeof workspaceData.onwner === 'object' && workspaceData.onwner?.id === user.id)) {
      return true;
    }
    
    // Check if user is Leader in members
    return workspaceData.members?.some((member: any) => {
      const memberUserId = typeof member.user === 'string' ? member.user : member.user?.id || member.user_id;
      return memberUserId === user.id && member.role === 'Leader';
    }) || false;
  }, [isAuthLoading, user, workspaceData]);
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex md:items-center gap-3">
            {workspaceData.color && (
              <WorkspaceAvatar
                color={workspaceData.color}
                name={workspaceData.name}
              />
            )}
            <h2 className="text-xl md:text-2xl font-semibold">
              {workspaceData.name}
            </h2>
          </div>

          <div className="flex items-center gap-3 justify-beetween md:justify-start mb-4 md:mb-0">
            {isCurrentUserLeader && (
              <>
                <Button variant={"outline"} onClick={workspace.onInviteMember}>
                  <UserPlus className="size-4 mr-2" /> Invite
                </Button>
                <Button onClick={workspace.onCreateProject}>
                  <Plus className="size-4 mr-2" /> Create Project
                </Button>
              </>
            )}
          </div>
        </div>
        {workspaceData.description && (
          <p className="text-sm md:text-base text-muted-foreground">
            {workspaceData.description}
          </p>
        )}
      </div>
      {workspaceData?.members && workspaceData?.members?.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Members</span>
          <div 
            className="flex -space-x-2 cursor-pointer"
            onClick={() => setIsMembersDialogOpen(true)}
          >
            {workspaceData?.members.map((member, index) => {
              const memberUserId = typeof member.user === 'string' ? member.user : member.user?.id || member.user_id;
              return (
                <Avatar
                  key={member.user_id || memberUserId}
                  className="w-8 h-8 rounded-full border-2 border-background overflow-hidden hover:z-10 transition-transform hover:scale-110"
                  title={member.user?.username || "Unknown User"}
                  style={{ zIndex: (workspaceData.members?.length || 0) - index }}
                >
                  <AvatarImage
                    src={member.user?.avatarUrl || undefined}
                    alt={member.user?.username || 'User Avatar'}
                  />
                  <AvatarFallback>
                    {member.user?.username ? getLastNameInitial(member.user.username) : "U"}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        </div>
      )}
      
      <WorkspaceMembersDialog
        isOpen={isMembersDialogOpen}
        onOpenChange={setIsMembersDialogOpen}
        workspace={workspaceData}
      />
    </div>
  );
};

export default WorkspaceHeader;
