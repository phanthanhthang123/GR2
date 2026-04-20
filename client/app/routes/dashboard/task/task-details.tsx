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
import { TaskDifficultySelector } from "@/components/task/task-difficulty-selector";
import { Watchers } from "@/components/task/watchers";
import { Archive, Eye, EyeOff, Folder } from "lucide-react";
import { TaskActivity } from "@/components/task/task-activity";
import { CommentSection } from "@/components/task/comment-section";
import { toast } from "sonner";
import type { Project } from "@/type";
import { TaskDueDate } from "@/components/task/task-due-date";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useUpdateTaskPullRequestUrlMutation } from "@/hooks/use-task";
import { ExternalLink, Link as LinkIcon, Copy } from "lucide-react";

const TaskDetails = () => {
    const { user } = useAuth();
    const { taskId, projectId, workspaceId } = useParams<{
        taskId: string;
        projectId: string;
        workspaceId: string;
    }>();
    const navigate = useNavigate();

    // All hooks must be called before any conditional returns
    const { data: task, isLoading, error } = useTaskByIdQuery(taskId! as any);
    const { data: projectData } = useProjectQueryById(projectId!);

    const {mutate: watchTask, isPending: isWatching} = useWatchTaskMutation();
    const {mutate: achievdTask, isPending: isAchived} = useAchievedTaskMutation();
    const {mutate: archiveTask, isPending: isArchiving} = useArchiveTaskMutation();
    const { mutate: updatePullRequestUrl, isPending: isUpdatingPullRequest } = useUpdateTaskPullRequestUrlMutation();

    // local state for editing PR URL (only on details page)
    // Must be declared before any conditional returns to keep hook order stable.
    const [pullRequestUrl, setPullRequestUrl] = useState<string>("");
    useEffect(() => {
        const next = (task as any)?.pullRequestUrl ? String((task as any).pullRequestUrl) : "";
        setPullRequestUrl(next);
    }, [task?.id, (task as any)?.pullRequestUrl]);

    const prUrlNormalized = useMemo(() => pullRequestUrl.trim(), [pullRequestUrl]);
    const isValidGithubPrUrl = useMemo(() => {
        if (!prUrlNormalized) return true;
        return /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+(?:\/)?(?:[#?].*)?$/i.test(prUrlNormalized);
    }, [prUrlNormalized]);

    const goBack = () => navigate(-1);

    // Early returns sau khi khai báo goBack
    if (isLoading) {
        return (
            <div>
                <Loader />
            </div>
        );
    }

    // Nếu backend trả 403 (không có quyền), hiển thị toast và quay lại
    if (error && (error as any)?.response?.status === 403) {
        toast.error("Bạn không có quyền truy cập task này.");
        goBack();
        return null;
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

    const handleSavePullRequestUrl = () => {
        if (!isValidGithubPrUrl) {
            toast.error("Link Pull Request không hợp lệ. Ví dụ: https://github.com/<owner>/<repo>/pull/<number>");
            return;
        }
        updatePullRequestUrl({
            taskId: String(task.id || taskId),
            pullRequestUrl: prUrlNormalized ? prUrlNormalized : null
        });
    };

    const handleOpenPullRequest = () => {
        if (!prUrlNormalized || !isValidGithubPrUrl) return;
        window.open(prUrlNormalized, "_blank", "noopener,noreferrer");
    };

    const handleCopyPullRequest = async () => {
        if (!prUrlNormalized) return;
        try {
            await navigator.clipboard.writeText(prUrlNormalized);
            toast.success("Đã copy link Pull Request");
        } catch {
            toast.error("Không thể copy link Pull Request");
        }
    };

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

    // Check project membership: nếu không thuộc project thì không cho xem task
    if (projectData?.project?.members && user?.id) {
        const isMember = projectData.project.members.some((m: any) => {
            const memberId =
                typeof m.user === "string"
                    ? m.user
                    : m.user?.id;
            return memberId?.toString() === user.id.toString();
        });

        if (!isMember) {
            toast.error("Bạn không có quyền truy cập task này.");
            goBack();
            return null;
        }
    }

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

                                {/* Deadline với chức năng chỉnh sửa */}
                                <TaskDueDate 
                                    dueDate={task?.dueDate || null} 
                                    taskId={String(task?.id || taskId)} 
                                />
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

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Chỉnh sửa độ ưu tiên</h3>
                                <TaskPrioritySelector
                                    priority={task?.priority as TaskPriority}
                                    taskId={String(task?.id || taskId || "")}
                                />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Chỉnh sửa độ khó</h3>
                                <TaskDifficultySelector
                                    difficulty={(task as any)?.difficulty || "Medium"}
                                    taskId={String(task?.id || taskId || "")}
                                />
                            </div>
                        </div>

                        {/* Pull Request (only after task created => details page) */}
                        <div className="mt-6 space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground mb-0 flex items-center gap-2">
                                <LinkIcon className="size-4" />
                                Pull Request
                            </h3>
                            <div className="flex flex-col md:flex-row gap-2">
                                <Input
                                    value={pullRequestUrl}
                                    onChange={(e) => setPullRequestUrl(e.target.value)}
                                    placeholder="https://github.com/<owner>/<repo>/pull/<number> (không bắt buộc)"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleOpenPullRequest}
                                        disabled={!prUrlNormalized || !isValidGithubPrUrl}
                                        className="w-full md:w-auto"
                                    >
                                        <ExternalLink className="mr-2 size-4" />
                                        Mở
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCopyPullRequest}
                                        disabled={!prUrlNormalized}
                                        className="w-full md:w-auto"
                                    >
                                        <Copy className="mr-2 size-4" />
                                        Copy
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSavePullRequestUrl}
                                        disabled={isUpdatingPullRequest || !isValidGithubPrUrl}
                                        className="w-full md:w-auto"
                                    >
                                        {isUpdatingPullRequest ? "Đang lưu..." : "Lưu"}
                                    </Button>
                                </div>
                            </div>
                            {!isValidGithubPrUrl && (
                                <div className="text-xs text-destructive">
                                    Link không hợp lệ (cần dạng `https://github.com/&lt;owner&gt;/&lt;repo&gt;/pull/&lt;number&gt;`).
                                </div>
                            )}
                        </div>
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