import React from "react";
import { Link } from "react-router";
import { Card, CardContent, CardTitle, CardHeader, CardFooter, CardDescription } from "../ui/card";
import { cn } from "@/lib/utils";
import { getTaskStatusColor, getProjectStatusLabel } from "@/lib";
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
  const progressValue = progess !== undefined ? progess : (project?.progress || 0);

  return (
    <Link to={`/workspaces/${workspaceId}/projects/${project.id}`} className="h-full block min-w-0">
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer h-full flex flex-col text-sm">
        <CardHeader className="flex-shrink-0 space-y-1.5 p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 min-h-0 pr-1">
              {project.name}
            </CardTitle>
            <span
              className={cn(
                "text-[10px] shrink-0 rounded-full px-1.5 py-0.5 whitespace-nowrap",
                getTaskStatusColor(project.status)
              )}
            >
              {getProjectStatusLabel(project.status)}
            </span>
          </div>
          <CardDescription className="line-clamp-2 text-xs min-h-[2.25rem] leading-relaxed">
            {project.description || "Chưa có mô tả"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-3 pt-0">
          <div className="space-y-2.5 flex-1 flex flex-col">
            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <span>Tiến độ</span>
                <span className="text-muted-foreground">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
            </div>

            <div className="space-y-1.5 mt-auto">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <span className="font-medium">{project?.tasks?.length || 0}</span>
                <span>Task</span>
              </div>

              <div className="flex flex-col gap-1">
                {project?.start_date && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    <span className="font-medium shrink-0">Bắt đầu:</span>
                    <span className="truncate">{format(new Date(project.start_date), "dd/MM/yyyy")}</span>
                  </div>
                )}

                {project?.end_date && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    <span className="font-medium shrink-0">Kết thúc:</span>
                    <span className="truncate">{format(new Date(project.end_date), "dd/MM/yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;
