import React from "react";
import { Link } from "react-router";
import { Card, CardContent, CardTitle, CardHeader, CardFooter, CardDescription } from "../ui/card";
import { cn } from "@/lib/utils";
import { getTaskStatusColor } from "@/lib";
import { Progress } from "../ui/progress";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

const ProjectCard = ({
  project,
  progess,
  workspaceId,
}: {
  project: any;
  progess: number;
  workspaceId: string;
}) => {
  console.log("project", project);
  // Use the progress prop passed from parent, or calculate from tasks if available
  const progressValue = progess !== undefined ? progess : (project?.progress || 0);
  
  return (
    <Link to={`/workspaces/${workspaceId}/projects/${project.id}`}>
      <Card className="hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{project.name}</CardTitle>
            <span className={cn("text-xs rounded-full px-2 py-1", getTaskStatusColor(project.status))}>{project.status}</span>
          </div>
          <CardDescription className="line-clamp-2">{project.description || "Chưa có mô tả"}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Tiến độ</span>
                <span className="text-muted-foreground">{progressValue}%</span>
              </div>
              <Progress
                value={progressValue}
                className="h-2"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm font-medium">
                  {project?.tasks?.length || 0}
                </span>
                <span>Task</span>
              </div>

              {project?.end_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-medium">Kết thúc:</span>
                  <span className="text-xs">{format(new Date(project.end_date), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;
