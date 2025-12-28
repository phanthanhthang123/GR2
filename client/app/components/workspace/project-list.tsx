import React from "react";
import { NoDataFound } from "./no-data-found";
import ProjectCard from "../project/project-card";
import { getProjectProgress } from "@/lib";

const ProjectList = (props: {
  workspaceId: string;
  projects: any[];
  isOpen: boolean;
  onCreateProject: () => void;
}) => {
  console.log(props);
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Dự Án</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {props.projects && props.projects.length === 0 ? (
          <NoDataFound
            title="Không tìm thấy dự án"
            description="Tạo một dự án mới để bắt đầu"
            buttonText="Tạo Dự Án"
            buttonAction={props.onCreateProject}
          />
        ) : (
          props.projects.map((project) => {
            // Calculate progress from tasks if available
            const tasks = project.tasks || [];
            const projectProgess = tasks.length > 0 
              ? getProjectProgress(tasks) 
              : (project.progress || 0);
            
            return (
              <ProjectCard
                key={project.id}
                project={project}
                progess={projectProgess}
                workspaceId={props.workspaceId}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectList;
