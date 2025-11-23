import type { User, Workspace } from "@/type";
import React from "react";
import { WorkspaceAvatar } from "./workspace-avatar";
import { Button } from "../ui/button";
import { Plus, UserPlus } from "lucide-react";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "../ui/avatar";

const WorkspaceHeader = (workspace: any) => {
  const workspaceData: Workspace = workspace.workspace;
  const getLastNameInitial = (username: string) => {
    if (!username || username.trim() === "") return "";
    const names = username.trim().split(" ").filter(name => name.length > 0);
    if (names.length === 0) return "";
    const lastName = names[names.length - 1];
    return lastName.charAt(0).toUpperCase();
  };
  console.log("workspaceData", workspaceData);
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
            <Button variant={"outline"} onClick={workspace.onInviteMember}>
              <UserPlus className="size-4 mr-2" /> Invite
            </Button>
            <Button onClick={workspace.onCreateProject}>
              <Plus className="size-4 mr-2" /> Create Project
            </Button>
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
          <div className="flex space-x-2">
            {workspaceData?.members.map((member) => (
              <Avatar
                key={member.user_id}
                className="w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                title={member.user.username}
              >
                <AvatarImage
                  src="{member.avatarUrl || ''}"
                  alt="{member.name || 'User Avatar'}"
                />
                <AvatarFallback>
                  {member.user.username ? getLastNameInitial(member.user.username) : "U"}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceHeader;
