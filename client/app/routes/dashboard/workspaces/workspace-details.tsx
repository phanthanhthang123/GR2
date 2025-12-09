import { CreateProjectDiaLog } from "@/components/project/create-project";
import ProjectList from "@/components/workspace/project-list";
import WorkspaceHeader from "@/components/workspace/workspace-header";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { useGetWorkspaceQueryById } from "@/hooks/use-workspace";
import { Loader } from "@/components/loader";
import React, { useState } from "react";
import { useParams } from "react-router";

const WorkspaceDetails = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCreateProject, setIsCreateProject] = useState(false);
  const [isInviteMember, setIsInviteMember] = useState(false);
  const { data, isLoading } = useGetWorkspaceQueryById(workspaceId || "");
  
  if (!workspaceId) {
    return <div>No workspace ID provided.</div>;
  }

  if (isLoading || !data) {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  // console.log(data)
  return (
    <div className="space-y-8">
      <WorkspaceHeader
        workspace={data}
        onCreateProject={() => setIsCreateProject(true)}
        onInviteMember={() => setIsInviteMember(true)}
      />
      <ProjectList
        workspaceId={workspaceId}
        isOpen={isCreateProject}
        projects={(data as any)?.projects || []}
        onCreateProject={() => setIsCreateProject(true)}
      />

      <CreateProjectDiaLog
        isOpen={isCreateProject}
        onOpenChange={() => setIsCreateProject(!isCreateProject)}
        workspaceId={workspaceId}
        workspaceMembers ={(data as any).members || []}
      />

      <InviteMemberDialog
        isOpen={isInviteMember}
        onOpenChange={() => setIsInviteMember(!isInviteMember)}
        workspaceId={workspaceId}
        existingMembers={(data as any)?.members || []}
      />
    </div>
  );
};

export default WorkspaceDetails;
