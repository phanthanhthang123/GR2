import { Loader } from "@/components/loader";
import { BackButton } from "@/components/back-button";
import { useAchievedTaskMutation, useArchiveTaskMutation, useTaskByIdQuery, useWatchTaskMutation } from "@/hooks/use-task";
import { useAuth } from "@/provider/auth-context";
import { useNavigate, useParams } from "react-router"
import { Badge } from "@/components/ui/badge";
import { TaskTitle } from "@/components/task/task-title";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import type { TaskPriority, TaskStatus, User } from "@/type";
import { TaskStatusSelector } from "@/components/task/task-status-selector";
import { TaskDescription } from "@/components/task/task-description";
import { useProjectQueryById } from "@/hooks/use-project";
import { TaskAssignessSelector } from "@/components/task/task-assigness-selector";
import { TaskPrioritySelector } from "@/components/task/task-priority-selector";
import { Watchers } from "@/components/task/watchers";
import { Archive, Eye, EyeOff, Folder } from "lucide-react";
import { TaskActivity } from "@/components/task/task-activity";
import { CommentSection } from "@/components/task/comment-section";
import { toast } from "sonner";
import type { Project } from "@/type";

const TaskDetails = () => {
    const { user } = useAuth();
    const { taskId, projectId, workspaceId } = useParams<{
        taskId: string;
        projectId: string;
        workspaceId: string;
    }>();
    const navigate = useNavigate();

    // All hooks must be called before any conditional returns
    const { data: task, isLoading } = useTaskByIdQuery(taskId! as any);
    const { data: projectData } = useProjectQueryById(projectId!);

    const {mutate: watchTask, isPending: isWatching} = useWatchTaskMutation();
    const {mutate: achievdTask, isPending: isAchived} = useAchievedTaskMutation();
    const {mutate: archiveTask, isPending: isArchiving} = useArchiveTaskMutation();

    console.log("task", task)

    // Early returns after all hooks are called
    if (isLoading) {
        return (
            <div>
                <Loader />
            </div>
        )
    }

    if (!task) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-2xl font-bold">
                        Không tìm thấy task
                </div>
            </div>
        )
    }

    const goBack = () => navigate(-1);

    // Get project information - prefer from task object, fallback to projectData query
    const project: Project | null = (() => {
        if (task?.project && typeof task.project === 'object') {
            return task.project as Project;
        }
        if (projectData?.project) {
            return projectData.project;
        }
        return null;
    })();

    const projectIdFromTask = project?.id || projectId;
    const projectName = project?.name || 'Unknown Project';

    const handleNavigateToProject = () => {
        if (projectIdFromTask && workspaceId) {
            navigate(`/workspaces/${workspaceId}/projects/${projectIdFromTask}`);
        }
    };

    const members = task?.assigned_to || [];
    const isUserWatching = task?.watchers?.some((watcher) => {
        const watcherId = typeof watcher === 'string' ? watcher : watcher?.id;
        return watcherId?.toString() === user?.id?.toString();
    });
    const handleWatchTask = () => {
        watchTask({ taskId: task.id }, {
            onSuccess: () => {
                // Toast is already handled in the hook, but you can add additional logic here if needed
            },
            onError: (error) => {
                // Toast is already handled in the hook, but you can add additional logic here if needed
                console.error("Failed to watch task:", error);
            }
        })
    }
    const handleAchievedTask = () => {
        achievdTask({ taskId: String(task.id) }, {
            onSuccess: () => {
                // Toast is already handled in the hook, but you can add additional logic here if needed
            },
            onError: (error) => {
                // Toast is already handled in the hook, but you can add additional logic here if needed
                console.error("Failed to mark task as achieved:", error);
            }
        })
    }
    const handleArchiveTask = () => {
        archiveTask({ taskId: String(task.id) }, {
            onSuccess: () => {
                // Toast is already handled in the hook, but you can add additional logic here if needed
            },
            onError: (error) => {
                // Toast is already handled in the hook, but you can add additional logic here if needed
                console.error("Failed to archive/unarchive task:", error);
            }
        })
    }
    return (
        <div className="container mx-auto p-0 py-4 md:px-4">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <BackButton />
                    <h1 className="text-xl md:text-2xl font-bold">{task?.title}</h1>
                    {
                        task.isArchived && (
                            <Badge
                                className="ml-2"
                                variant={"outline"}
                            >
                                    Đã lưu trữ
                            </Badge>
                        )
                    }
                    </div>
                    {project && (
                        <div className="flex items-center gap-2 ml-12">
                            <Folder className="size-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Dự án:</span>
                            <Button
                                variant="link"
                                className="h-auto p-0 text-sm font-medium text-primary hover:underline"
                                onClick={handleNavigateToProject}
                            >
                                {projectName}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleWatchTask}
                        className="w-fit"
                        disabled={isWatching}
                    >
                        {isUserWatching ? (
                            <>
                                <EyeOff className="mr-2 size-4" /> Bỏ theo dõi
                            </>
                        ) : (
                            <>
                                <Eye className="mr-2 size-4" /> Theo dõi
                            </>
                        )}
                    </Button>

                    {task.status !== 'Done' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAchievedTask}
                            className="w-fit"
                            disabled={isAchived}
                        >
                            <Archive className="mr-2 size-4" /> Đánh dấu hoàn thành
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleArchiveTask}
                        className="w-fit"
                        disabled={isArchiving}
                    >
                        {task.isArchived ? (
                            <>
                                <Archive className="mr-2 size-4" /> Bỏ lưu trữ
                            </>
                        ) : (
                            <>
                                <Archive className="mr-2 size-4" /> Lưu trữ
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-card p-6 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                    className={
                                        task?.priority === "High"
                                            ? "bg-red-500 text-white"
                                            : task?.priority === "Medium"
                                                ? "bg-yellow-500 text-white"
                                                : "bg-slate-500 text-white"
                                    }
                                >
                                        Ưu tiên {task?.priority === "High" ? "Cao" : task?.priority === "Medium" ? "Trung bình" : "Thấp"}
                                    </Badge>
                                    {project && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Folder className="size-3" />
                                            {projectName}
                                </Badge>
                                    )}
                                </div>

                                <TaskTitle title={task?.title} taskId={String(task?.id || taskId)} />

                                <div className="text-sm md:text-base text-muted-foreground">
                                    Tạo lúc:{" "}
                                    {task?.createdAt ? formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }) : 'N/A'}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 md:mt-0">
                                <TaskStatusSelector status={task?.status as TaskStatus} taskId={String(task?.id || taskId)} />
                                <Button
                                    variant={"destructive"}
                                    size={"sm"}
                                    onClick={() => { }}
                                    className="hidden md:block"
                                >
                                    Xóa Task
                                </Button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-0">Mô tả</h3>
                            <TaskDescription description={task?.description || 'Chưa có mô tả'} taskId={String(task?.id || taskId)} />
                        </div>

                        <TaskAssignessSelector
                            task={task}
                            assignees={task?.assignedUser || null}
                            projectMembers={projectData?.project?.members || null}
                        />

                        <TaskPrioritySelector
                            priority={task?.priority as TaskPriority}
                            taskId={String(task?.id || taskId || "")}
                        />
                    </div>

                    <CommentSection taskId={String(task?.id || taskId || "")} members={projectData?.project?.members || []} />
                </div>

                {/* right side */}
                <div className="lg:col-span-1">
                    <Watchers watchers={task?.watchers as User[] || []}/>
                    <TaskActivity resourceId={String(task?.id || taskId || "")}/>
                </div>
            </div>
        </div>

    )
}

export default TaskDetails