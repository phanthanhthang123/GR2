import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router';
import type { Task } from '@/type';
import { useProjectQueryById, useUpdateProjectTitleMutation, useUpdateProjectDescriptionMutation, useUpdateProjectStatusMutation, useAddMemberToProjectMutation, useRemoveMemberFromProjectMutation, useProjectDelayPrediction, useUpdateProjectGithubUrlMutation } from '@/hooks/use-project';
import type { PredictionResult, ModelEvaluation } from '@/hooks/use-project';
import type { TaskStatus } from '@/type';
import { Loader } from '@/components/loader';
import { getProjectProgress } from '@/lib';
import { fetchData } from '@/lib/fetch-utlis';
import { BackButton } from '@/components/back-button';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CreateTaskDialog } from '@/components/task/create-task-dialog';
import { TaskCard } from '@/components/task/task-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useArchiveTaskMutation } from '@/hooks/use-task';
import { Archive, CheckSquare, Users, Edit, Trash2, UserPlus, CalendarDays, Search, ChevronDown, ChevronRight, ExternalLink, Copy, Github, BrainCircuit, AlertTriangle, Lightbulb, ShieldCheck, ShieldAlert, Loader2, BarChart3, Target, TrendingUp, Activity, GitBranch, GitCommit } from 'lucide-react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/provider/auth-context';
import { getChatSocket } from '@/hooks/use-chat';
import { useGetAllUsersQuery } from '@/hooks/use-workspace';
import { useMemo } from 'react';

const TASKS_PER_PAGE_TABLE = 10;

const ProjectDetails = () => {

    const { projectId, workspaceId } = useParams<{ projectId: string, workspaceId: string }>();
    const navigate = useNavigate();

    const [isCreateTask, setIsCreateTask] = useState(false);
    const [taskFilter, setTaskFilter] = useState<'All' | 'To Do' | 'In Progress' | 'Done' | 'Archived'>('All');
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [isDeleteMemberConfirmOpen, setIsDeleteMemberConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{ userId: string; username: string } | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [taskSearchQuery, setTaskSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({});
    const [statusPages, setStatusPages] = useState<Record<string, number>>({});
    const [taskPage, setTaskPage] = useState(1);
    const { user } = useAuth();
    const [isPredictionDialogOpen, setIsPredictionDialogOpen] = useState(false);
    const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

    // All hooks must be called before any conditional returns
    const { data, isLoading, error } = useProjectQueryById(projectId!);
    const queryClient = useQueryClient();
    const { mutate: archiveTask, isPending: isArchiving } = useArchiveTaskMutation();
    const { mutate: updateTitle, isPending: isUpdatingTitle } = useUpdateProjectTitleMutation();
    const { mutate: updateDescription, isPending: isUpdatingDescription } = useUpdateProjectDescriptionMutation();
    const { mutate: addMember, isPending: isAddingMember } = useAddMemberToProjectMutation();
    const { mutate: removeMember, isPending: isRemovingMember } = useRemoveMemberFromProjectMutation();
    const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateProjectStatusMutation();
    const [isPredictingLocal, setIsPredictingLocal] = useState(false);
    // const { mutate: predictDelay, isPending: isPredicting } = useProjectDelayPrediction();
    const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersQuery(searchQuery);

    // Extract project and tasks early (before any hooks that depend on them)
    const project = data?.project;
    const tasks = data?.tasks || [];

    const [isEditingGitUrl, setIsEditingGitUrl] = useState(false);
    const [newGitUrl, setNewGitUrl] = useState('');
    const updateGithubUrlMutation = useUpdateProjectGithubUrlMutation();
    const [isSyncingGithub, setIsSyncingGithub] = useState(false);
    const [githubStats, setGithubStats] = useState<{
        branchesCount: number;
        commitsCount: number;
        branches: string[];
        latestCommits: Array<{ sha: string; message: string; author: string; date: string; branch?: string }>;
    } | null>(null);

    const handleSyncGithub = async () => {
        if (!projectId) return;
        try {
            setIsSyncingGithub(true);
            const { postData } = await import("@/lib/fetch-utlis");
            const res = await postData<any>("/github/sync", { projectId });
            if (res?.err === 0) {
                toast.success(res.msg || "Đã đồng bộ thông tin từ GitHub thành công!");
                if (res.stats) {
                    setGithubStats(res.stats);
                }
                queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            } else {
                toast.error(res?.msg || "Không thể đồng bộ GitHub");
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.msg || "Có lỗi xảy ra khi đồng bộ GitHub");
        } finally {
            setIsSyncingGithub(false);
        }
    };

    useEffect(() => {
        if (project?.githubRepoUrl && projectId) {
            const fetchStatsOnLoad = async () => {
                try {
                    const { postData } = await import("@/lib/fetch-utlis");
                    const res = await postData<any>("/github/sync", { projectId });
                    if (res?.err === 0 && res.stats) {
                        setGithubStats(res.stats);
                    }
                } catch (e) {
                    console.error("Error fetching stats on load:", e);
                }
            };
            fetchStatsOnLoad();
        }
    }, [project?.githubRepoUrl, projectId]);

    useEffect(() => {
        if (project && !isEditingGitUrl) {
            setNewGitUrl(project.githubRepoUrl || '');
        }
    }, [project, isEditingGitUrl]);

    useEffect(() => {
        if (!projectId) return;
        const socket = getChatSocket();
        if (!socket) return;

        const onMembersUpdated = () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            toast.info("Đã đồng bộ thành viên dự án qua GitHub");
        };

        const onGithubActivity = (payload?: { stats?: any }) => {
            if (payload?.stats) {
                setGithubStats(payload.stats);
            } else {
                handleSyncGithub();
            }
            toast.info("Có hoạt động GitHub mới trên Repository");
        };

        socket.on(`project-members-updated:${projectId}`, onMembersUpdated);
        socket.on(`project-github-activity:${projectId}`, onGithubActivity);

        return () => {
            socket.off(`project-members-updated:${projectId}`, onMembersUpdated);
            socket.off(`project-github-activity:${projectId}`, onGithubActivity);
        };
    }, [projectId, queryClient]);

    // Filter out archived tasks from main view
    const activeTasks = useMemo(() => tasks?.filter(task => !task.isArchived) || [], [tasks]);
    const archivedTasks = useMemo(() => tasks?.filter(task => task.isArchived) || [], [tasks]);

    // Filter tasks based on search query
    const filteredActiveTasks = useMemo(() => {
        if (!taskSearchQuery.trim()) {
            return activeTasks;
        }
        const query = taskSearchQuery.toLowerCase();
        return activeTasks.filter((task) => {
            const title = (task.title || "").toLowerCase();
            const description = (task.description || "").toLowerCase();
            return title.includes(query) || description.includes(query);
        });
    }, [activeTasks, taskSearchQuery]);

    const filteredArchivedTasks = useMemo(() => {
        if (!taskSearchQuery.trim()) {
            return archivedTasks;
        }
        const query = taskSearchQuery.toLowerCase();
        return archivedTasks.filter((task) => {
            const title = (task.title || "").toLowerCase();
            const description = (task.description || "").toLowerCase();
            return title.includes(query) || description.includes(query);
        });
    }, [archivedTasks, taskSearchQuery]);

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, Task[]> = {
            'To Do': filteredActiveTasks.filter(task => task.status === 'To Do'),
            'In Progress': filteredActiveTasks.filter(task => task.status === 'In Progress'),
            'Done': filteredActiveTasks.filter(task => task.status === 'Done'),
        };
        return grouped;
    }, [filteredActiveTasks]);

    const getDifficultyLabel = (difficulty?: string | null) => {
        switch ((difficulty || "").toString()) {
            case "Easy":
                return "Dễ";
            case "Hard":
                return "Khó";
            case "Medium":
            default:
                return "Trung bình";
        }
    };

    // Tasks for table view by status filter + pagination
    const statusFilteredTasks = useMemo(() => {
        if (taskFilter === 'All') return filteredActiveTasks;
        return filteredActiveTasks.filter((task) => task.status === taskFilter);
    }, [filteredActiveTasks, taskFilter]);

    const totalTaskPages = useMemo(() => {
        if (statusFilteredTasks.length === 0) return 1;
        return Math.ceil(statusFilteredTasks.length / TASKS_PER_PAGE_TABLE);
    }, [statusFilteredTasks.length]);

    const paginatedStatusTasks = useMemo(() => {
        const safePage = Math.min(Math.max(taskPage, 1), totalTaskPages);
        const startIndex = (safePage - 1) * TASKS_PER_PAGE_TABLE;
        const endIndex = startIndex + TASKS_PER_PAGE_TABLE;
        return statusFilteredTasks.slice(startIndex, endIndex);
    }, [statusFilteredTasks, taskPage, totalTaskPages]);

    // Reset page when filter hoặc search thay đổi
    useEffect(() => {
        setTaskPage(1);
    }, [taskFilter, taskSearchQuery]);

    // Initialize expanded statuses and pages
    React.useEffect(() => {
        const initialExpanded: Record<string, boolean> = {};
        const initialPages: Record<string, number> = {};
        Object.keys(tasksByStatus).forEach((status) => {
            initialExpanded[status] = true;
            initialPages[status] = 1;
        });
        setExpandedStatuses(initialExpanded);
        setStatusPages(initialPages);
    }, [filteredActiveTasks.length]);

    const toggleStatus = (status: string) => {
        setExpandedStatuses(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

    const setStatusPage = (status: string, page: number) => {
        setStatusPages(prev => ({
            ...prev,
            [status]: page
        }));
    };

    const projectProgess = useMemo(() => getProjectProgress(activeTasks as { status: TaskStatus }[]), [activeTasks]);

    // Get project statistics
    const totalTasksInProject = useMemo(() => tasks?.length || 0, [tasks]);
    const totalMembersInProject = useMemo(() => (project as any)?.members?.length || 0, [project]);

    // === QUICK WIN ANALYTICS ===

    // 1. Task sắp hết hạn trong 3 ngày (chưa Done)
    const upcomingDeadlineTasks = useMemo(() => {
        const now = new Date();
        const threshold = addDays(now, 3);
        return activeTasks.filter((task) => {
            if (!task.dueDate || task.status === 'Done') return false;
            const due = new Date(task.dueDate);
            return !isAfter(due, threshold) || isBefore(due, now);
        }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    }, [activeTasks]);

    // Task đã quá hạn (dueDate < now và chưa Done)
    const overdueCount = useMemo(() => {
        const now = new Date();
        return activeTasks.filter((task) => {
            if (!task.dueDate || task.status === 'Done') return false;
            return isBefore(new Date(task.dueDate), now);
        }).length;
    }, [activeTasks]);

    // 2. Phân bổ task theo thành viên
    const memberTaskDistribution = useMemo(() => {
        const members = (project as any)?.members || [];
        const memberMap: Record<string, { name: string; todo: number; inProgress: number; done: number }> = {};
        members.forEach((m: any) => {
            const u = typeof m.user === 'object' ? m.user : null;
            const id = typeof m.user === 'string' ? m.user : u?.id || m.user_id;
            if (id) {
                memberMap[id] = {
                    name: u?.username?.split(' ').pop() || 'N/A',
                    todo: 0,
                    inProgress: 0,
                    done: 0,
                };
            }
        });
        activeTasks.forEach((task) => {
            const rawAssignedTo = task.assigned_to;
            let assignedId: string | null = null;
            if (typeof rawAssignedTo === 'string') {
                assignedId = rawAssignedTo;
            } else if (Array.isArray(rawAssignedTo) && rawAssignedTo.length > 0) {
                assignedId = (rawAssignedTo[0] as any)?.id || null;
            }
            if (assignedId && memberMap[assignedId]) {
                if (task.status === 'To Do') memberMap[assignedId].todo++;
                else if (task.status === 'In Progress') memberMap[assignedId].inProgress++;
                else if (task.status === 'Done') memberMap[assignedId].done++;
            }
        });
        return Object.values(memberMap).filter((m) => m.todo + m.inProgress + m.done > 0);
    }, [activeTasks, project]);

    // 3. Tốc độ hoàn thành 7 ngày qua
    const weeklyCompletionData = useMemo(() => {
        const days: { label: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const day = addDays(new Date(), -i);
            const dayLabel = format(day, 'dd/MM');
            const count = tasks.filter((t) => {
                if (t.status !== 'Done' || !t.updatedAt) return false;
                const updated = new Date(t.updatedAt);
                return format(updated, 'dd/MM/yyyy') === format(day, 'dd/MM/yyyy');
            }).length;
            days.push({ label: dayLabel, count });
        }
        return days;
    }, [tasks]);

    // 4. Timeline progress (% thời gian đã dùng)
    const timelineInfo = useMemo(() => {
        const startDate = (project as any)?.start_date;
        const endDate = (project as any)?.end_date;
        if (!startDate || !endDate) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        const total = differenceInDays(end, start);
        const elapsed = Math.min(Math.max(differenceInDays(now, start), 0), total);
        const remaining = Math.max(differenceInDays(end, now), 0);
        const percentTime = total > 0 ? Math.round((elapsed / total) * 100) : 0;
        const isOverdue = isAfter(now, end);
        return { start, end, total, elapsed, remaining, percentTime, isOverdue };
    }, [project]);

    // Check if current user is leader - must be called before early return
    const isCurrentUserLeader = useMemo(() => {
        if (!user || !project) return false;
        
        // System Admins and system Leaders have leader privileges on all projects
        if (user.role === 'Admin' || user.role === 'Leader') return true;

        const leaderId = typeof (project as any).leader_id === 'string'
            ? (project as any).leader_id
            : (project as any).leader?.id || (project as any).leader_id;
        if (leaderId === user.id || (project as any).created_by === user.id) return true;
        return (project as any)?.members?.some((member: any) => {
            const memberUserId = typeof member.user === 'string' ? member.user : member.user?.id || member.user_id;
            return memberUserId === user.id && member.role === 'Leader';
        }) || false;
    }, [user, project]);

    // Filter available users (not already members) - must be called before early return
    const availableUsers = useMemo(() => {
        const users = (usersData as any)?.response || [];
        if (!users || users.length === 0 || !project) return [];
        const existingMemberIds = ((project as any)?.members || []).map((m: any) =>
            typeof m.user === 'string' ? m.user : m.user?.id || m.user_id
        );
        return users.filter((user: any) => !existingMemberIds.includes(user.id));
    }, [usersData, project]);

    // Initialize title and description
    useEffect(() => {
        if (project && !isEditingTitle) {
            setNewTitle(project.name || '');
        }
        if (project && !isEditingDescription) {
            setNewDescription(project.description || '');
        }
    }, [project, isEditingTitle, isEditingDescription]);

    // Handle access denied error
    useEffect(() => {
        if (error && (error as any)?.response?.status === 403) {
            const errorMsg = (error as any)?.response?.data?.msg || "Bạn không phải là thành viên trong project này";
            toast.error(errorMsg);
            // Redirect back to workspace
            if (workspaceId) {
                navigate(`/workspaces/${workspaceId}`);
            } else {
                navigate('/dashboard');
            }
        } else if (error) {
            toast.error("Không thể tải dự án");
        }
    }, [error, navigate, workspaceId]);

    // Early returns after all hooks are called
    if (isLoading) {
        return (
            <div>
                <Loader />
            </div>
        )
    }

    if (!data || data.err !== 0) {
        // Check if it's a permission error
        if (data?.code === "NOT_PROJECT_MEMBER" || data?.msg?.includes("không phải là thành viên")) {
            return null; // Will be handled by useEffect
        }
        return (
            <div>
                <p>Không thể tải dự án</p>
            </div>
        )
    }

    if (!project) {
        return (
            <div>
                <p>Không tìm thấy dự án</p>
            </div>
        )
    }

    console.log("task", tasks)

    const handleEditTitle = () => {
        setIsEditingTitle(true);
        setNewTitle(project?.name || '');
    };

    const handleSaveTitle = () => {
        if (!newTitle.trim()) {
            toast.error("Tên dự án không được để trống");
            return;
        }
        updateTitle({ projectId: projectId!, title: newTitle }, {
            onSuccess: () => {
                setIsEditingTitle(false);
            }
        });
    };

    const handleCancelTitle = () => {
        setNewTitle(project?.name || '');
        setIsEditingTitle(false);
    };

    const handleEditDescription = () => {
        setIsEditingDescription(true);
        setNewDescription(project?.description || '');
    };

    const handleSaveDescription = () => {
        updateDescription({ projectId: projectId!, description: newDescription }, {
            onSuccess: () => {
                setIsEditingDescription(false);
            }
        });
    };

    const handleCancelDescription = () => {
        setNewDescription(project?.description || '');
        setIsEditingDescription(false);
    };

    const handleAddMember = () => {
        if (!selectedUserId) {
            toast.error("Vui lòng chọn thành viên");
            return;
        }
        addMember({ projectId: projectId!, userId: selectedUserId }, {
            onSuccess: () => {
                setIsAddMemberDialogOpen(false);
                setSelectedUserId('');
                setSearchQuery('');
            }
        });
    };

    const handleRemoveMember = (userId: string, username: string) => {
        setMemberToDelete({ userId, username });
        setIsDeleteMemberConfirmOpen(true);
    };

    const handleConfirmRemove = () => {
        if (memberToDelete) {
            removeMember({ projectId: projectId!, userId: memberToDelete.userId }, {
                onSuccess: () => {
                    setIsDeleteMemberConfirmOpen(false);
                    setMemberToDelete(null);
                }
            });
        }
    };

    const handleTaskClick = (taskId: string) => {
        navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
    }

    const handlePredictDelay = async () => {
        if (!projectId) return;
        try {
            setIsPredictingLocal(true);
            console.log("Calling API manually...");
            const data = await fetchData<PredictionResult>(`/project/${projectId}/predict-delay`);
            console.log("Prediction success data:", data);
            toast.success("Phân tích hoàn tất!");
            setPredictionResult(data);
            setIsPredictionDialogOpen(true);
            // Invalidate project query to refresh stored prediction card in UI
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        } catch (err: any) {
            console.error("Prediction error:", err);
            toast.error("Lỗi: " + (err?.response?.data?.msg || err.message));
        } finally {
            setIsPredictingLocal(false);
        }
    };

    const handleUnarchiveTask = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation when clicking unarchive button
        archiveTask({ taskId }, {
            onSuccess: () => {
                // Invalidate project query to refresh the task list
                queryClient.invalidateQueries({
                    queryKey: ["project", projectId],
                });
            }
        });
    }


    return (
        <div className='space-y-6'>
            {/* Header Section */}
            {/* Header Section */}
            <div className='bg-gradient-to-r from-background to-muted/30 rounded-lg border p-4 md:p-6 shadow-sm'>
                <BackButton />
                
                {/* Title & Status Block relocated here above the column split */}
                <div className='mt-4 mb-4 space-y-4'>
                    <div className='flex items-center gap-3'>
                        {isEditingTitle ? (
                            <Input
                                className="text-2xl md:text-3xl font-bold h-auto py-2"
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                disabled={isUpdatingTitle}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitle();
                                    if (e.key === 'Escape') handleCancelTitle();
                                }}
                                autoFocus
                            />
                        ) : (
                            <>
                                <h1 className='text-2xl md:text-3xl font-bold text-foreground'>{project?.name}</h1>
                                {isCurrentUserLeader && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleEditTitle}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit className="size-4" />
                                    </Button>
                                )}
                                {isCurrentUserLeader ? (
                                    <select
                                        value={(project as any)?.status || 'Pending'}
                                        onChange={(e) => {
                                            updateStatus({ projectId: projectId!, status: e.target.value });
                                        }}
                                        disabled={isUpdatingStatus}
                                        className={cn(
                                            "ml-2 h-8 rounded-md border px-2 py-1 text-xs font-semibold shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors",
                                            (project as any)?.status === 'Completed'
                                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
                                                : (project as any)?.status === 'In Progress'
                                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800"
                                                    : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
                                            isUpdatingStatus && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <option value="Pending">Đang chờ</option>
                                        <option value="In Progress">Đang tiến hành</option>
                                        <option value="Completed">Hoàn thành</option>
                                    </select>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "ml-2 text-xs font-semibold",
                                            (project as any)?.status === 'Completed'
                                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
                                                : (project as any)?.status === 'In Progress'
                                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800"
                                                    : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                                        )}
                                    >
                                        {(project as any)?.status === 'Completed' ? 'Hoàn thành'
                                            : (project as any)?.status === 'In Progress' ? 'Đang tiến hành'
                                            : 'Đang chờ'}
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                    {isEditingTitle && (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={handleSaveTitle}
                                disabled={isUpdatingTitle}
                            >
                                Lưu
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelTitle}
                                disabled={isUpdatingTitle}
                            >
                                Hủy
                            </Button>
                        </div>
                    )}
                </div>

                <div className='flex flex-col md:flex-row md:items-start justify-between gap-6'>
                    <div className='flex-1 space-y-4'>
                        {/* GitHub Repository + Progress (same row for Member) */}
                        <div className={cn("gap-3", user?.role === 'Member' ? "flex flex-col md:flex-row md:items-stretch" : "")}>
                            <div className={cn("rounded-lg border bg-background/60 p-3", user?.role === 'Member' ? "flex-1" : "")}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Github className="size-4 text-muted-foreground" />
                                        GitHub Repository
                                    </div>
                                    {isCurrentUserLeader && !isEditingGitUrl && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setIsEditingGitUrl(true);
                                                setNewGitUrl(project.githubRepoUrl || '');
                                            }}
                                            className="h-6 px-2 text-xs"
                                        >
                                            <Edit className="size-3 mr-1" />
                                            Sửa
                                        </Button>
                                    )}
                                </div>
                                <div className="mt-2 flex flex-col md:flex-row gap-2">
                                    {isEditingGitUrl ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <Input
                                                value={newGitUrl}
                                                onChange={(e) => setNewGitUrl(e.target.value)}
                                                placeholder="https://github.com/owner/repo"
                                                className="flex-1"
                                                autoFocus
                                            />
                                            <Button
                                                size="sm"
                                                disabled={updateGithubUrlMutation.isPending}
                                                onClick={() => {
                                                    updateGithubUrlMutation.mutate({
                                                        projectId: projectId!,
                                                        githubRepoUrl: newGitUrl
                                                    }, {
                                                        onSuccess: () => setIsEditingGitUrl(false)
                                                    });
                                                }}
                                            >
                                                Lưu
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={updateGithubUrlMutation.isPending}
                                                onClick={() => setIsEditingGitUrl(false)}
                                            >
                                                Hủy
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                value={(project as any)?.githubRepoUrl || ""}
                                                readOnly
                                                placeholder="Chưa có URL repository GitHub"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const url = ((project as any)?.githubRepoUrl || "").toString().trim();
                                                        if (!url) return;
                                                        window.open(url, "_blank", "noopener,noreferrer");
                                                    }}
                                                    disabled={!((project as any)?.githubRepoUrl || "").toString().trim()}
                                                >
                                                    <ExternalLink className="mr-2 size-4" />
                                                    Mở GitHub
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={async () => {
                                                        const url = ((project as any)?.githubRepoUrl || "").toString().trim();
                                                        if (!url) return;
                                                        try {
                                                            await navigator.clipboard.writeText(url);
                                                            toast.success("Đã copy link GitHub repository");
                                                        } catch {
                                                            toast.error("Không thể copy link GitHub repository");
                                                        }
                                                    }}
                                                    disabled={!((project as any)?.githubRepoUrl || "").toString().trim()}
                                                >
                                                    <Copy className="mr-2 size-4" />
                                                    Copy
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Progress Section - inline for Member role */}
                            {user?.role === 'Member' && (
                                <Card className="p-4 md:min-w-[280px] flex items-center">
                                    <div className='space-y-2 w-full'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-sm font-medium'>Tiến độ dự án</span>
                                            <span className='text-sm font-bold text-primary'>{projectProgess ? projectProgess : 0}%</span>
                                        </div>
                                        <Progress value={projectProgess ? projectProgess : 0} className='h-2.5' />
                                    </div>
                                </Card>
                            )}
                        </div>

                        <div className='space-y-2'>
                            {isEditingDescription ? (
                                <>
                                    <Textarea
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        className='text-sm min-h-[80px]'
                                        disabled={isUpdatingDescription}
                                        placeholder="Nhập mô tả dự án..."
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={handleSaveDescription}
                                            disabled={isUpdatingDescription}
                                        >
                                            Lưu
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCancelDescription}
                                            disabled={isUpdatingDescription}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className='flex items-start gap-2'>
                                    {project?.description ? (
                                        <p className='text-sm text-muted-foreground leading-relaxed'>{project?.description}</p>
                                    ) : (
                                        <p className='text-sm text-muted-foreground/60 italic'>Chưa có mô tả</p>
                                    )}
                                    {isCurrentUserLeader && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEditDescription}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tổng quan tiến độ — chỉ Admin & Leader mới thấy dưới mô tả, chiều cao nhỏ gọn hơn */}
                        {user?.role !== 'Member' && (
                            <Card className="p-3 space-y-2 max-w-xl bg-background/60">
                                <div className='flex items-center justify-between text-xs font-semibold'>
                                    <span className='flex items-center gap-1.5'><CheckSquare className='size-3.5 text-teal-500' /> Tiến độ công việc</span>
                                    <span className='text-teal-600'>{projectProgess || 0}%</span>
                                </div>
                                <Progress value={projectProgess || 0} className='h-1.5 [&>div]:bg-teal-500' />
                                
                                {timelineInfo && (
                                    <>
                                        <div className='flex items-center justify-between text-xs font-semibold pt-1 border-t'>
                                            <span className='flex items-center gap-1.5'><CalendarDays className='size-3.5 text-blue-500' /> Tiến độ thời gian</span>
                                            <span className={cn(timelineInfo.isOverdue ? 'text-rose-600' : 'text-blue-600')}>{timelineInfo.percentTime}%</span>
                                        </div>
                                        <Progress value={Math.min(timelineInfo.percentTime, 100)} className={cn('h-1.5', timelineInfo.isOverdue ? '[&>div]:bg-rose-500' : '[&>div]:bg-blue-400')} />
                                        
                                        <p className={cn('text-[10px] font-medium pt-0.5', (projectProgess || 0) >= timelineInfo.percentTime ? 'text-teal-600' : 'text-amber-600')}>
                                            {(projectProgess || 0) >= timelineInfo.percentTime
                                                ? '✓ Công việc đang đúng tiến độ'
                                                : `⚠ Công việc chậm hơn thời gian ${timelineInfo.percentTime - (projectProgess || 0)}%`}
                                        </p>
                                    </>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Right sidebar - only show for non-Member roles */}
                    {user?.role !== 'Member' && (
                        <div className='flex flex-col gap-4 md:min-w-[280px]'>
                            {/* Stored AI Prediction Card */}
                            {(project as any)?.prediction && (
                                <Card className={cn(
                                    "p-4 border-l-4",
                                    (project as any).prediction.delay_risk_level === 'High' ? "border-l-red-500 bg-red-50/30 dark:bg-red-950/10" :
                                    (project as any).prediction.delay_risk_level === 'Medium' ? "border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10" :
                                    "border-l-green-500 bg-green-50/30 dark:bg-green-950/10"
                                )}>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phân tích rủi ro gần nhất</span>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] py-0 px-1.5 font-bold",
                                                (project as any).prediction.delay_risk_level === 'High' ? "bg-red-100 text-red-800 border-red-200" :
                                                (project as any).prediction.delay_risk_level === 'Medium' ? "bg-amber-100 text-amber-800 border-amber-200" :
                                                "bg-green-100 text-green-800 border-green-200"
                                            )}>
                                                {(project as any).prediction.delay_risk_level === 'High' ? 'Rủi ro Cao' :
                                                 (project as any).prediction.delay_risk_level === 'Medium' ? 'Trung bình' : 'Rủi ro Thấp'}
                                            </Badge>
                                        </div>
                                        <div className="text-xs space-y-1">
                                            {(project as any).prediction.estimated_completion_date && (
                                                <p className="text-muted-foreground">
                                                    Hoàn thành dự kiến: <span className="font-medium text-foreground">{format(new Date((project as any).prediction.estimated_completion_date), "MMM d, yyyy")}</span>
                                                </p>
                                            )}
                                            {(project as any).prediction.delay_reason && (project as any).prediction.delay_reason !== 'N/A' && (
                                                <p className="text-[11px] italic text-muted-foreground line-clamp-2" title={(project as any).prediction.delay_reason}>
                                                    Nguyên nhân: {(project as any).prediction.delay_reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Action Buttons */}
                            <div className='flex flex-col gap-2'>
                                {isCurrentUserLeader && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsAddMemberDialogOpen(true)}
                                        className="w-full"
                                    >
                                        <UserPlus className="mr-2 size-4" />
                                        Thêm Thành Viên
                                    </Button>
                                )}
                                {isCurrentUserLeader && (
                                    <Button onClick={() => setIsCreateTask(true)} className="w-full">
                                        <CheckSquare className="mr-2 size-4" />
                                        Thêm Task
                                    </Button>
                                )}
                                {project.githubRepoUrl && (
                                    <Button
                                        variant="outline"
                                        onClick={handleSyncGithub}
                                        disabled={isSyncingGithub}
                                        className="w-full"
                                    >
                                        {isSyncingGithub ? (
                                            <Loader2 className="mr-2 size-4 animate-spin text-muted-foreground" />
                                        ) : (
                                            <Github className="mr-2 size-4 text-slate-700" />
                                        )}
                                        {isSyncingGithub ? "Đang đồng bộ..." : "Đồng bộ GitHub"}
                                    </Button>
                                )}
                                {isCurrentUserLeader && (
                                    <Button
                                        onClick={handlePredictDelay}
                                        disabled={isPredictingLocal}
                                        className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white hover:text-white border-none shadow-md shadow-orange-500/30 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg font-semibold"
                                    >
                                        {isPredictingLocal ? (
                                            <Loader2 className="mr-2 size-4 animate-spin text-white" />
                                        ) : (
                                            <BrainCircuit className="mr-2 size-4 text-white" />
                                        )}
                                        {isPredictingLocal ? 'Đang phân tích...' : 'Đánh giá rủi ro (AI)'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Project Statistics */}
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
                {/* Tổng Task */}
                <Card
                    className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group py-1.5"
                    onClick={() => setIsTaskDialogOpen(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-0.5 px-3 pt-2">
                        <CardTitle className="text-[11px] font-semibold text-muted-foreground">Tổng Task</CardTitle>
                        <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <CheckSquare className="h-3.5 w-3.5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                        <div className="text-lg font-bold text-foreground leading-none">{totalTasksInProject}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {activeTasks.length} đang hoạt động
                        </p>
                    </CardContent>
                </Card>

                {/* Hoàn thành */}
                <Card className="hover:shadow-lg hover:border-teal-500/50 transition-all group py-1.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-0.5 px-3 pt-2">
                        <CardTitle className="text-[11px] font-semibold text-muted-foreground">Hoàn Thành</CardTitle>
                        <div className="p-1.5 rounded-lg bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                            <Target className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                        <div className="text-lg font-bold text-teal-600 leading-none">{tasksByStatus['Done']?.length || 0}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {projectProgess || 0}% tiến độ
                        </p>
                    </CardContent>
                </Card>

                {/* Quá hạn */}
                <Card className={cn('hover:shadow-lg transition-all group py-1.5', overdueCount > 0 ? 'border-rose-200 hover:border-rose-400' : 'hover:border-primary/50')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-0.5 px-3 pt-2">
                        <CardTitle className="text-[11px] font-semibold text-muted-foreground">Quá Hạn</CardTitle>
                        <div className={cn('p-1.5 rounded-lg transition-colors', overdueCount > 0 ? 'bg-rose-100 group-hover:bg-rose-200' : 'bg-slate-100')}>
                            <AlertTriangle className={cn('h-3.5 w-3.5', overdueCount > 0 ? 'text-rose-500' : 'text-slate-400')} />
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                        <div className={cn('text-lg font-bold leading-none', overdueCount > 0 ? 'text-rose-600' : 'text-foreground')}>{overdueCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {upcomingDeadlineTasks.length} sắp hết hạn
                        </p>
                    </CardContent>
                </Card>

                {/* Thành Viên */}
                <Card
                    className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group py-1.5"
                    onClick={() => setIsMemberDialogOpen(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-0.5 px-3 pt-2">
                        <CardTitle className="text-[11px] font-semibold text-muted-foreground">Thành Viên</CardTitle>
                        <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                        <div className="text-lg font-bold text-foreground leading-none">{totalMembersInProject}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            người tham gia
                        </p>
                    </CardContent>
                </Card>

                {/* Bắt đầu */}
                {(project as any)?.start_date ? (
                    <Card className="hover:shadow-lg hover:border-primary/50 transition-all py-1.5">
                        <CardHeader className="flex flex-row items-center justify-between pb-0.5 px-3 pt-2">
                            <CardTitle className="text-[11px] font-semibold text-muted-foreground">Bắt Đầu</CardTitle>
                            <div className="p-1.5 rounded-lg bg-green-500/10">
                                <CalendarDays className="h-3.5 w-3.5 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-2">
                            <div className="text-sm font-bold text-foreground leading-none">
                                {format(new Date((project as any).start_date), "dd/MM/yyyy")}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Ngày bắt đầu</p>
                        </CardContent>
                    </Card>
                ) : <div />}

                {/* Kết thúc */}
                {(project as any)?.end_date ? (
                    <Card className={cn('hover:shadow-lg transition-all py-1.5', timelineInfo?.isOverdue ? 'border-rose-200 hover:border-rose-400' : 'hover:border-primary/50')}>
                        <CardHeader className="flex flex-row items-center justify-between pb-0.5 px-3 pt-2">
                            <CardTitle className="text-[11px] font-semibold text-muted-foreground">Kết Thúc</CardTitle>
                            <div className={cn('p-1.5 rounded-lg', timelineInfo?.isOverdue ? 'bg-rose-100' : 'bg-orange-500/10')}>
                                <CalendarDays className={cn('h-3.5 w-3.5', timelineInfo?.isOverdue ? 'text-rose-500' : 'text-orange-600')} />
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-2">
                            <div className={cn('text-sm font-bold leading-none', timelineInfo?.isOverdue ? 'text-rose-600' : 'text-foreground')}>
                                {format(new Date((project as any).end_date), "dd/MM/yyyy")}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                {timelineInfo ? (timelineInfo.isOverdue ? '⚠ Đã quá hạn' : `Còn ${timelineInfo.remaining} ngày`) : 'Ngày kết thúc'}
                            </p>
                        </CardContent>
                    </Card>
                ) : <div />}
            </div>

            {/* GitHub Statistics & Activity */}
            {project?.githubRepoUrl && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Commits & Branches Stats */}
                    <Card className="md:col-span-1 p-4 flex flex-col justify-between h-[220px]">
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex items-center justify-between border-b pb-1.5 shrink-0">
                                <h3 className="font-semibold text-xs flex items-center gap-1.5">
                                    <Github className="size-3.5 text-slate-800" />
                                    Thống kê GitHub
                                </h3>
                                <Badge variant="secondary" className="text-[9px] py-0 px-1.5 bg-green-50 text-green-700 border border-green-200">Connected</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-2 shrink-0">
                                <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50 text-center">
                                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                                        <GitBranch className="size-3 text-blue-500" />
                                        Branches
                                    </p>
                                    <p className="text-base font-bold text-slate-800 mt-0.5">{githubStats?.branchesCount ?? "-"}</p>
                                </div>
                                <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50 text-center">
                                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                                        <GitCommit className="size-3 text-green-500" />
                                        Commits
                                    </p>
                                    <p className="text-base font-bold text-slate-800 mt-0.5">{githubStats?.commitsCount ?? "-"}</p>
                                </div>
                            </div>
                            
                            {/* List of branches */}
                            <div className="flex-1 min-h-0 mt-2 border-t pt-1.5 flex flex-col justify-start">
                                <p className="text-[9px] text-muted-foreground font-semibold mb-1 shrink-0">Branches:</p>
                                <div className="flex-1 overflow-y-auto max-h-[50px] pr-1">
                                    {githubStats?.branches && githubStats.branches.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {githubStats.branches.map((branch) => (
                                                <Badge key={branch} variant="outline" className="text-[9px] font-mono bg-slate-50 text-slate-600 border-slate-200 py-0.5 px-1.5">
                                                    {branch}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[9px] text-muted-foreground italic">Không có branch nào</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-[9px] text-muted-foreground mt-1.5 border-t pt-1.5 italic shrink-0 truncate">
                            Repo: {project.githubRepoOwner}/{project.githubRepoName}
                        </div>
                    </Card>

                    {/* Latest Commits Activity Feed */}
                    <Card className="md:col-span-2 p-4 flex flex-col h-[220px]">
                        <div className="flex items-center justify-between border-b pb-2 mb-3 shrink-0">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Activity className="size-4 text-indigo-500" />
                                Lịch sử Commits mới nhất
                            </h3>
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            {githubStats?.latestCommits && githubStats.latestCommits.length > 0 ? (
                                <div className="space-y-2 pr-3">
                                    {githubStats.latestCommits.map((commit) => {
                                        const commitBranch = commit.branch || 'main';
                                        return (
                                            <a
                                                key={commit.sha}
                                                href={`https://github.com/${project.githubRepoOwner}/${project.githubRepoName}/commit/${commit.sha}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-start justify-between gap-4 p-2 rounded-lg bg-muted/30 border border-muted text-xs hover:bg-slate-50 hover:border-blue-200 transition-all cursor-pointer block"
                                            >
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Badge variant="outline" className="text-[9px] font-mono bg-blue-50 text-blue-600 border-blue-200 py-0 px-1 shrink-0">
                                                            {commitBranch}
                                                        </Badge>
                                                        <span className="text-slate-400 text-[10px] shrink-0">➔</span>
                                                        <p className="font-medium text-foreground truncate max-w-[320px] inline">
                                                            {commit.message}
                                                        </p>
                                                    </div>
                                                    <p className="text-muted-foreground text-[10px]">
                                                        bởi <span className="font-medium text-foreground">{commit.author}</span> • {format(new Date(commit.date), "dd/MM/yyyy HH:mm")}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="font-mono text-[9px] shrink-0 bg-white">
                                                    {commit.sha.substring(0, 7)}
                                                </Badge>
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-xs text-muted-foreground">
                                    Chưa có dữ liệu commits. Hãy nhấn "Đồng bộ GitHub" để cập nhật.
                                </div>
                            )}
                        </ScrollArea>
                    </Card>
                </div>
            )}

            {/* === ANALYTICS SECTION — chỉ Admin & Leader === */}
            {user?.role !== 'Member' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Timeline dự án */}
                {timelineInfo && (
                    <Card className="lg:col-span-3 p-4 border-l-4 border-l-teal-500">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <CalendarDays className="size-4 text-teal-600" />
                                Timeline Dự Án
                            </h3>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-muted-foreground">Bắt đầu: <span className="font-medium text-foreground">{format(timelineInfo.start, 'dd/MM/yyyy')}</span></span>
                                <span className="text-slate-400">→</span>
                                <span className="text-muted-foreground">Kết thúc: <span className={cn('font-medium', timelineInfo.isOverdue ? 'text-rose-600' : 'text-foreground')}>{format(timelineInfo.end, 'dd/MM/yyyy')}</span></span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Đã dùng {timelineInfo.elapsed} ngày / {timelineInfo.total} ngày</span>
                                <span className={cn('font-semibold', timelineInfo.isOverdue ? 'text-rose-600' : timelineInfo.percentTime > 80 ? 'text-amber-600' : 'text-teal-600')}>
                                    {timelineInfo.isOverdue ? '⚠ Đã quá hạn!' : `Còn ${timelineInfo.remaining} ngày`}
                                </span>
                            </div>
                            <div className="relative w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all', timelineInfo.isOverdue ? 'bg-rose-500' : timelineInfo.percentTime > 80 ? 'bg-amber-500' : 'bg-teal-500')}
                                    style={{ width: `${Math.min(timelineInfo.percentTime, 100)}%` }}
                                />
                                <div
                                    className="absolute top-0 h-full border-r-2 border-dashed border-teal-700/50"
                                    style={{ left: `${Math.min(timelineInfo.percentTime, 100)}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span className="text-teal-600 font-medium">{timelineInfo.percentTime}% thời gian đã qua</span>
                                <span className="text-blue-600 font-medium">{projectProgess || 0}% công việc hoàn thành</span>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Card cảnh báo task sắp hết hạn */}
                <Card className={cn('p-4', upcomingDeadlineTasks.length > 0 ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-slate-200')}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <AlertTriangle className={cn('size-4', upcomingDeadlineTasks.length > 0 ? 'text-rose-500' : 'text-slate-400')} />
                            Cảnh Báo Deadline
                        </h3>
                        {overdueCount > 0 && (
                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] font-bold">
                                {overdueCount} quá hạn
                            </Badge>
                        )}
                    </div>
                    {upcomingDeadlineTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                            <ShieldCheck className="size-8 text-teal-400 opacity-60" />
                            <p className="text-xs text-muted-foreground">Không có task nào sắp hết hạn</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {upcomingDeadlineTasks.slice(0, 6).map((task) => {
                                const due = new Date(task.dueDate!);
                                const daysLeft = differenceInDays(due, new Date());
                                const isOver = daysLeft < 0;
                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => handleTaskClick(String(task.id))}
                                        className="w-full text-left p-2 rounded-md border hover:bg-rose-50 transition-colors group"
                                    >
                                        <p className="text-xs font-medium text-foreground truncate group-hover:text-rose-700">{task.title}</p>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-[10px] text-muted-foreground">{format(due, 'dd/MM/yyyy')}</span>
                                            <span className={cn('text-[10px] font-semibold', isOver ? 'text-rose-600' : daysLeft === 0 ? 'text-amber-600' : 'text-orange-500')}>
                                                {isOver ? `Trễ ${Math.abs(daysLeft)} ngày` : daysLeft === 0 ? 'Hôm nay!' : `Còn ${daysLeft} ngày`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Phân bổ task theo thành viên */}
                <Card className="p-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <Users className="size-4 text-blue-500" />
                        Phân Bổ Task Theo Thành Viên
                    </h3>
                    {memberTaskDistribution.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                            <Users className="size-8 text-slate-300" />
                            <p className="text-xs text-muted-foreground">Chưa có task được giao</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={memberTaskDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ fontSize: 11 }}
                                    formatter={(value: number, name: string) => [
                                        value,
                                        name === 'todo' ? 'Chưa làm' : name === 'inProgress' ? 'Đang làm' : 'Hoàn thành'
                                    ]}
                                />
                                <Bar dataKey="todo" fill="#94a3b8" name="todo" stackId="a" radius={[0,0,0,0]} />
                                <Bar dataKey="inProgress" fill="#f59e0b" name="inProgress" stackId="a" />
                                <Bar dataKey="done" fill="#0d9488" name="done" stackId="a" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    <div className="flex items-center gap-3 mt-2 justify-center">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />Chưa làm</span>
                        <span className="flex items-center gap-1 text-[10px] text-amber-600"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Đang làm</span>
                        <span className="flex items-center gap-1 text-[10px] text-teal-600"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" />Hoàn thành</span>
                    </div>
                </Card>

                {/* Tốc độ hoàn thành 7 ngày qua */}
                <Card className="p-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <TrendingUp className="size-4 text-teal-500" />
                        Task Hoàn Thành (7 Ngày Qua)
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={weeklyCompletionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ fontSize: 11 }}
                                formatter={(value: number) => [value, 'Task done']}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {weeklyCompletionData.map((entry, index) => (
                                    <Cell key={index} fill={entry.count > 0 ? '#0d9488' : '#e2e8f0'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-muted-foreground text-center mt-1">
                        Tổng: <span className="font-semibold text-teal-600">{weeklyCompletionData.reduce((s, d) => s + d.count, 0)}</span> task Done trong 7 ngày
                    </p>
                </Card>
            </div>
            )} {/* end analytics — Admin & Leader only */}

            {/* Task Details Dialog */}
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Chi Tiết Task</DialogTitle>
                        <DialogDescription>
                            Danh sách tất cả task trong dự án
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] mt-4">
                        <div className="space-y-2 pr-4">
                            {tasks && tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors cursor-pointer"
                                        onClick={() => {
                                            setIsTaskDialogOpen(false);
                                            handleTaskClick(task.id);
                                        }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="text-sm font-medium truncate">{task.title}</p>
                                                {task.githubIssueUrl && (
                                                    <a
                                                        href={task.githubIssueUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-1.5 py-0.5 rounded border border-slate-200/60 transition-colors"
                                                    >
                                                        <svg className="size-2.5 text-slate-700" viewBox="0 0 16 16" fill="currentColor">
                                                            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                                        </svg>
                                                        <span>#{task.githubIssueNumber || 'Issue'}</span>
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        task.status === 'Done'
                                                            ? "bg-green-100 text-green-800"
                                                            : task.status === 'In Progress'
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-gray-100 text-gray-800"
                                                    }
                                                >
                                                    {task.status === 'To Do' ? 'Chưa Làm' : task.status === 'In Progress' ? 'Đang Làm' : 'Hoàn Thành'}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        task.priority === 'High'
                                                            ? "bg-red-100 text-red-800"
                                                            : task.priority === 'Medium'
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-gray-100 text-gray-800"
                                                    }
                                                >
                                                    {task.priority}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-slate-100 text-slate-800"
                                                >
                                                    {getDifficultyLabel((task as any).difficulty)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    Chưa có task nào
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Member Details Dialog */}
            <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Thành Viên Dự Án</DialogTitle>
                        <DialogDescription>
                            Danh sách tất cả thành viên trong dự án này
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] mt-4">
                        {totalMembersInProject > 0 ? (
                            <div className="space-y-2 pr-4">
                                {(project as any)?.members?.map((member: any, index: number) => {
                                    const memberUser = typeof member.user === 'object' ? member.user : null;
                                    const memberUserId = typeof member.user === 'string' ? member.user : member.user?.id || member.user_id;

                                    // Role hệ thống gốc trên user (có thể dạng admin/kleader/member hoặc Admin/Leader/Member)
                                    const systemRoleRaw = (memberUser?.role as string | undefined) || '';
                                    // Role trong project (Leader/Manager/Developer/leader/manager/...)
                                    const projectRoleRaw = (member.role as string | undefined) || '';

                                    const systemRole = systemRoleRaw.toLowerCase();
                                    const projectRole = projectRoleRaw.toLowerCase();

                                    // Xác định leader để chặn nút xoá
                                    const isLeader =
                                        projectRole === 'leader' ||
                                        (project as any).leader_id === memberUserId ||
                                        systemRole === 'leader' ||
                                        systemRole === 'kleader';

                                    const canDelete = isCurrentUserLeader && 
                                         (user?.role === 'Admin' ? memberUserId !== user?.id : (!isLeader && memberUserId !== user?.id));

                                    const getLastNameInitial = (username: string) => {
                                        if (!username || username.trim() === "") return "";
                                        const names = username.trim().split(" ").filter(name => name.length > 0);
                                        if (names.length === 0) return "";
                                        const lastName = names[names.length - 1];
                                        return lastName.charAt(0).toUpperCase();
                                    };

                                    return (
                                        <div
                                            key={member.user_id || index}
                                            className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors"
                                        >
                                            <Avatar className="size-10">
                                                <AvatarImage
                                                    src={memberUser?.avatarUrl || undefined}
                                                    alt={memberUser?.username || "User Avatar"}
                                                />
                                                <AvatarFallback>
                                                    {memberUser?.username
                                                        ? getLastNameInitial(memberUser.username)
                                                        : "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium truncate">
                                                        {memberUser?.username || "Người dùng không xác định"}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs">
                                                        {systemRole === 'admin'
                                                            ? 'Admin'
                                                            : systemRole === 'leader' || systemRole === 'kleader'
                                                                ? 'Leader'
                                                                : systemRole === 'member'
                                                                    ? 'Member'
                                                                    : projectRole === 'leader'
                                                                        ? 'Leader'
                                                                        : 'Member'}
                                                    </Badge>
                                                    {project?.githubRepoUrl && (
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn(
                                                                "text-[10px] py-0 px-1.5 font-semibold",
                                                                member.status === 'Active'
                                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                                            )}
                                                        >
                                                            {member.status === 'Active' ? 'Active (GitHub)' : 'Pending (GitHub Invite)'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {memberUser?.email || "Không có email"}
                                                </p>
                                                {memberUser?.githubUsername && (
                                                    <a
                                                        href={`https://github.com/${memberUser.githubUsername}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors mt-0.5"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Github className="size-3" />
                                                        <span>@{memberUser.githubUsername}</span>
                                                    </a>
                                                )}
                                            </div>
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveMember(memberUserId, memberUser?.username || "Người dùng không xác định")}
                                                    disabled={isRemovingMember}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                Chưa có thành viên nào
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Thêm Thành Viên</DialogTitle>
                        <DialogDescription>
                            Thêm thành viên mới vào dự án này
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium">Tìm Người Dùng</label>
                            <Input
                                placeholder="Tìm theo tên hoặc email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <ScrollArea className="h-[300px] border rounded-md mt-2">
                            {isLoadingUsers ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader />
                                </div>
                            ) : availableUsers.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    {searchQuery ? "Không tìm thấy người dùng" : "Bắt đầu nhập để tìm kiếm"}
                                </div>
                            ) : (
                                <div className="p-2 space-y-2">
                                    {availableUsers.map((userItem: any) => {
                                        const isSelected = selectedUserId === userItem.id;
                                        const systemRoleRaw = (userItem?.role as string | undefined) || '';
                                        const systemRole = systemRoleRaw.toLowerCase();

                                        const getLastNameInitial = (username: string) => {
                                            if (!username || username.trim() === "") return "";
                                            const names = username.trim().split(" ").filter(name => name.length > 0);
                                            if (names.length === 0) return "";
                                            const lastName = names[names.length - 1];
                                            return lastName.charAt(0).toUpperCase();
                                        };

                                        return (
                                            <div
                                                key={userItem.id}
                                                onClick={() => setSelectedUserId(userItem.id)}
                                                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer border transition-colors ${isSelected
                                                        ? "bg-primary/10 border-primary"
                                                        : "hover:bg-accent border-transparent"
                                                    }`}
                                            >
                                                <Avatar className="size-10">
                                                    <AvatarImage src={userItem.avatarUrl || undefined} />
                                                    <AvatarFallback>
                                                        {userItem.username
                                                            ? getLastNameInitial(userItem.username)
                                                            : "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium truncate">
                                                            {userItem.username}
                                                        </p>
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1 font-semibold">
                                                            {systemRole === 'admin'
                                                                ? 'Admin'
                                                                : systemRole === 'leader' || systemRole === 'kleader'
                                                                    ? 'Leader'
                                                                    : 'Member'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {userItem.email}
                                                    </p>
                                                    {userItem.githubUsername && (
                                                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                                            <Github className="size-3" />
                                                            <span>@{userItem.githubUsername}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="size-4 rounded-full bg-primary flex items-center justify-center">
                                                        <div className="size-2 rounded-full bg-primary-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddMemberDialogOpen(false);
                                setSelectedUserId('');
                                setSearchQuery('');
                            }}
                            disabled={isAddingMember}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleAddMember}
                            disabled={isAddingMember || !selectedUserId}
                        >
                            {isAddingMember ? "Đang thêm..." : "Thêm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Member Dialog */}
            <Dialog open={isDeleteMemberConfirmOpen} onOpenChange={setIsDeleteMemberConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Xác Nhận Xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa <strong>{memberToDelete?.username}</strong> khỏi dự án này? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteMemberConfirmOpen(false);
                                setMemberToDelete(null);
                            }}
                            disabled={isRemovingMember}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmRemove}
                            disabled={isRemovingMember}
                        >
                            {isRemovingMember ? "Đang xóa..." : "Xóa Thành Viên"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tasks Section */}
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="p-4 bg-muted/30 rounded-lg border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm task..."
                            value={taskSearchQuery}
                            onChange={(e) => setTaskSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Modern Status Board */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg md:text-xl">
                                    Bảng Trạng Thái Task
                                </CardTitle>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                    Nhìn nhanh toàn bộ luồng công việc từ Chưa Làm → Đang Làm → Hoàn Thành.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm">
                                <div className="rounded-lg bg-blue-50 px-3 py-2 border border-blue-100">
                                    <p className="font-medium text-blue-800">Chưa Làm</p>
                                    <p className="text-blue-600">
                                        {tasksByStatus["To Do"]?.length || 0} task
                                    </p>
                                </div>
                                <div className="rounded-lg bg-amber-50 px-3 py-2 border border-amber-100">
                                    <p className="font-medium text-amber-800">Đang Làm</p>
                                    <p className="text-amber-600">
                                        {tasksByStatus["In Progress"]?.length || 0} task
                                    </p>
                                </div>
                                <div className="rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-100">
                                    <p className="font-medium text-emerald-800">Hoàn Thành</p>
                                    <p className="text-emerald-600">
                                        {tasksByStatus["Done"]?.length || 0} task
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Bộ lọc trạng thái cho bảng */}
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {([
                                    { key: 'All', label: 'Tất cả' },
                                    { key: 'To Do', label: 'Chưa Làm' },
                                    { key: 'In Progress', label: 'Đang Làm' },
                                    { key: 'Done', label: 'Hoàn Thành' },
                                ] as const).map((item) => (
                                    <Button
                                        key={item.key}
                                        type="button"
                                        size="sm"
                                        variant={taskFilter === item.key ? 'default' : 'outline'}
                                        onClick={() => setTaskFilter(item.key)}
                                        className="text-xs md:text-sm"
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">
                                Đang hiển thị {paginatedStatusTasks.length} / {statusFilteredTasks.length} task
                            </div>
                        </div>

                        {/* Bảng task theo trạng thái + phân trang */}
                        <div className="rounded-xl border bg-background overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/60 border-b">
                                        <tr className="text-left">
                                            <th className="px-4 py-2 w-[60px] font-medium text-xs text-muted-foreground">
                                                ID
                                            </th>
                                            <th className="px-4 py-2 min-w-[220px] font-medium text-xs text-muted-foreground">
                                                Tiêu đề
                                            </th>
                                            <th className="px-4 py-2 min-w-[120px] font-medium text-xs text-muted-foreground">
                                                Trạng thái
                                            </th>
                                            <th className="px-4 py-2 min-w-[100px] font-medium text-xs text-muted-foreground">
                                                Ưu tiên
                                            </th>
                                            <th className="px-4 py-2 min-w-[120px] font-medium text-xs text-muted-foreground">
                                                Độ khó
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statusFilteredTasks.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                                                >
                                                    Chưa có task nào phù hợp
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedStatusTasks.map((task) => (
                                                <tr
                                                    key={task.id}
                                                    className="cursor-pointer hover:bg-muted/60 border-b last:border-0"
                                                    onClick={() => handleTaskClick(String(task.id))}
                                                >
                                                    <td className="px-4 py-2 text-xs text-muted-foreground">
                                                        {task.id}
                                                    </td>
                                                    <td className="px-4 py-2 font-medium">
                                                        {task.title}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-xs",
                                                                task.status === 'Done'
                                                                    ? "bg-green-100 text-green-800"
                                                                    : task.status === 'In Progress'
                                                                        ? "bg-blue-100 text-blue-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                            )}
                                                        >
                                                            {task.status === 'To Do'
                                                                ? 'Chưa Làm'
                                                                : task.status === 'In Progress'
                                                                    ? 'Đang Làm'
                                                                    : 'Hoàn Thành'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-xs",
                                                                task.priority === 'High'
                                                                    ? "bg-red-100 text-red-800"
                                                                    : task.priority === 'Medium'
                                                                        ? "bg-yellow-100 text-yellow-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                            )}
                                                        >
                                                            {task.priority}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn("text-xs bg-slate-100 text-slate-800")}
                                                        >
                                                            {getDifficultyLabel((task as any).difficulty)}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Phân trang cho bảng */}
                            {statusFilteredTasks.length > 0 && (
                                <div className="flex flex-col items-center gap-3 px-4 py-3 border-t bg-muted/40">
                                    <Pagination>
                                        <PaginationContent className="gap-2">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (taskPage > 1) {
                                                            setTaskPage(taskPage - 1);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "min-w-[90px] h-8 text-xs",
                                                        taskPage === 1
                                                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                                                            : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                    )}
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: totalTaskPages }, (_, i) => i + 1).map((page) => {
                                                if (
                                                    page === 1 ||
                                                    page === totalTaskPages ||
                                                    (page >= taskPage - 1 && page <= taskPage + 1)
                                                ) {
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setTaskPage(page);
                                                                }}
                                                                isActive={taskPage === page}
                                                                className={cn(
                                                                    "min-w-[32px] h-8 text-xs flex items-center justify-center",
                                                                    taskPage === page
                                                                        ? "bg-primary text-primary-foreground font-semibold"
                                                                        : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                                )}
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                } else if (page === taskPage - 2 || page === taskPage + 2) {
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <span className="px-1 py-1 text-muted-foreground text-xs">...</span>
                                                        </PaginationItem>
                                                    );
                                                }
                                                return null;
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (taskPage < totalTaskPages) {
                                                            setTaskPage(taskPage + 1);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "min-w-[90px] h-8 text-xs",
                                                        taskPage === totalTaskPages
                                                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                                                            : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                    )}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>

                                    <div className="text-xs text-muted-foreground">
                                        Trang {taskPage} / {totalTaskPages} • Hiển thị{" "}
                                        {(taskPage - 1) * TASKS_PER_PAGE_TABLE + 1}
                                        -
                                        {Math.min(taskPage * TASKS_PER_PAGE_TABLE, statusFilteredTasks.length)}{" "}
                                        trong tổng số {statusFilteredTasks.length} task
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Archived Tasks giữ nguyên */}
                        {filteredArchivedTasks.length > 0 && (
                            <div className="border rounded-lg overflow-hidden mt-4">
                                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50">
                                    <Archive className="size-4 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold flex-1">
                                        Đã Lưu Trữ
                                    </h2>
                                    <Badge variant="outline" className="ml-auto">
                                        {filteredArchivedTasks.length}{" "}
                                        {filteredArchivedTasks.length === 1 ? "task" : "tasks"}
                                    </Badge>
                                </div>
                                <div className="p-4">
                                    <ArchivedTaskColumn
                                        title="Task Đã Lưu Trữ"
                                        tasks={filteredArchivedTasks}
                                        onTaskClick={handleTaskClick}
                                        onUnarchive={handleUnarchiveTask}
                                        isArchiving={isArchiving}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


            {/* Create Task Dialog */}
            <CreateTaskDialog
                open={isCreateTask}
                onOpenChange={setIsCreateTask}
                projectId={projectId!}
                projectMembers={(project as any)?.members || []}
            />

            {/* AI Prediction Dialog — Premium */}
            <Dialog open={isPredictionDialogOpen} onOpenChange={setIsPredictionDialogOpen}>
                <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto p-0">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-5 rounded-t-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-white text-lg">
                                <BrainCircuit className="size-6" />
                                Đánh giá Rủi ro Dự án (AI)
                            </DialogTitle>
                            <DialogDescription className="text-white/80 text-sm">
                                Kết quả phân tích dựa trên thuật toán Random Forest — Đánh giá mô hình chi tiết
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {predictionResult?.prediction && (
                        <div className="space-y-5 px-6 py-5">

                            {/* ── 1. Risk Level ── */}
                            <div className="flex items-center justify-center p-5 rounded-xl border-2 shadow-sm" style={{
                                borderColor: predictionResult.prediction.risk_level === 'High' ? '#ef4444' : predictionResult.prediction.risk_level === 'Medium' ? '#f59e0b' : '#22c55e',
                                background: predictionResult.prediction.risk_level === 'High' ? 'linear-gradient(135deg,#fef2f2,#fee2e2)' : predictionResult.prediction.risk_level === 'Medium' ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)'
                            }}>
                                <div className="text-center">
                                    {predictionResult.prediction.risk_level === 'High' ? <ShieldAlert className="size-12 text-red-500 mx-auto mb-2" /> : predictionResult.prediction.risk_level === 'Medium' ? <AlertTriangle className="size-12 text-amber-500 mx-auto mb-2" /> : <ShieldCheck className="size-12 text-green-500 mx-auto mb-2" />}
                                    <p className="text-xl font-bold" style={{ color: predictionResult.prediction.risk_level === 'High' ? '#dc2626' : predictionResult.prediction.risk_level === 'Medium' ? '#d97706' : '#16a34a' }}>
                                        {predictionResult.prediction.risk_level === 'High' ? 'Rủi ro CAO — Có nguy cơ trễ hạn' : predictionResult.prediction.risk_level === 'Medium' ? 'Rủi ro TRUNG BÌNH — Cần chú ý' : 'Rủi ro THẤP — Tiến độ ổn định'}
                                    </p>
                                    {predictionResult.prediction.model_evaluation?.prediction_confidence && (
                                        <p className="text-sm mt-1 font-medium" style={{ color: predictionResult.prediction.risk_level === 'High' ? '#b91c1c' : predictionResult.prediction.risk_level === 'Medium' ? '#b45309' : '#15803d' }}>
                                            Độ tin cậy dự đoán: {predictionResult.prediction.model_evaluation.prediction_confidence.confidence_percent}%
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── 2. Prediction Confidence Breakdown ── */}
                            {predictionResult.prediction.model_evaluation?.prediction_confidence && (
                                <div className="rounded-xl border p-4 bg-gradient-to-br from-background to-muted/20 shadow-sm">
                                    <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                                        <Target className="size-4 text-violet-500" />
                                        Xác suất từng mức rủi ro (lần dự đoán này)
                                    </p>
                                    <div className="space-y-2">
                                        {Object.entries(predictionResult.prediction.model_evaluation.prediction_confidence.probabilities).map(([label, prob]) => {
                                            const pct = Math.round(prob * 100);
                                            const color = label === 'High' ? '#ef4444' : label === 'Medium' ? '#f59e0b' : '#22c55e';
                                            const isPredicted = label === predictionResult.prediction.model_evaluation?.prediction_confidence.predicted_class;
                                            const ringClass = label === 'High' ? 'ring-red-500' : label === 'Medium' ? 'ring-amber-500' : 'ring-green-500';
                                            return (
                                                <div key={label} className={cn("rounded-lg p-2 transition-all", isPredicted ? `ring-2 ring-offset-1 bg-muted/40 ${ringClass}` : "")}>
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="font-medium">{label === 'Low' ? '🟢 Thấp' : label === 'Medium' ? '🟡 Trung bình' : '🔴 Cao'} {isPredicted && '← Dự đoán'}</span>
                                                        <span className="font-bold">{pct}%</span>
                                                    </div>
                                                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}



                            {/* ── 7. Input Summary ── */}
                            <div className="rounded-xl border p-4 bg-muted/30 shadow-sm">
                                <p className="text-xs font-semibold mb-2 text-muted-foreground">📋 Dữ liệu đầu vào (tại thời điểm phân tích)</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                    <span>Thành viên: <strong>{predictionResult.prediction.input_summary.team_size}</strong></span>
                                    <span>Tổng task: <strong>{predictionResult.prediction.input_summary.total_tasks}</strong></span>
                                    <span>Thời gian đã qua: <strong>{Math.round(predictionResult.prediction.input_summary.elapsed_time_ratio * 100)}%</strong></span>
                                    <span>Hoàn thành: <strong>{Math.round(predictionResult.prediction.input_summary.task_completion_ratio * 100)}%</strong></span>
                                    <span>Task quá hạn: <strong className="text-red-600">{predictionResult.prediction.input_summary.overdue_tasks_count}</strong></span>
                                    <span>Task khó còn lại: <strong className="text-orange-600">{predictionResult.prediction.input_summary.remaining_hard_tasks}</strong></span>
                                </div>
                            </div>

                            {/* ── 8. Suggestions ── */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold flex items-center gap-1.5">
                                    <Lightbulb className="size-4 text-amber-500" />
                                    Nguyên nhân & Gợi ý hành động
                                </p>
                                {predictionResult.prediction.suggestions.map((s, idx) => (
                                    <div key={idx} className="rounded-xl border p-3 space-y-1.5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-foreground">{s.description}</p>
                                            <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                                                Ảnh hưởng: {Math.round(s.importance * 100)}%
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-primary bg-primary/5 rounded-lg p-2.5">
                                            💡 {s.suggestion}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
};

export default ProjectDetails;

interface TaskColumnProps {
    title: string;
    tasks: Task[];
    onTaskClick: (taskId: string) => void;
    isFullWidth?: boolean;
}

const TASKS_PER_PAGE = 3; // Maximum 3 tasks per page

const TaskColumn = ({ title, tasks, onTaskClick, isFullWidth = false }: TaskColumnProps) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Paginate for both kanban and full width modes
    const totalPages = Math.ceil(tasks.length / TASKS_PER_PAGE);
    const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
    const endIndex = startIndex + TASKS_PER_PAGE;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    // Reset to page 1 when tasks change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [tasks.length]);

    // Kanban mode: fixed width column with horizontal task layout and pagination
    if (!isFullWidth) {
        return (
            <div className="flex-shrink-0 w-full sm:w-[320px] flex flex-col bg-muted/30 rounded-lg border shadow-sm">
                {/* Column Header */}
                <div className='flex items-center justify-between px-4 py-3 border-b bg-background/50 rounded-t-lg'>
                    <h1 className='font-semibold text-sm'>{title}</h1>
                    <Badge variant="outline" className="text-xs">{tasks?.length}</Badge>
                </div>

                {/* Tasks Container - Horizontal Layout */}
                <div className="flex-1 px-3 py-3 min-h-[400px] flex flex-col">
                    {tasks.length === 0 ? (
                        <div className='text-center text-sm text-muted-foreground py-8 flex-1 flex items-center justify-center'>
                            Chưa có task nào
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-x-auto pb-3 w-full" style={{ scrollbarWidth: 'thin' }}>
                                <div className="flex gap-3 min-w-max">
                                    {paginatedTasks.map((task) => (
                                        <div key={task.id} className="w-[280px] flex-shrink-0">
                                            <TaskCard
                                                task={task}
                                                onClick={() => onTaskClick(task.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pagination */}
                            {tasks.length > 0 && (
                                <div className="mt-3 pt-3 border-t flex flex-col items-center gap-2">
                                    <Pagination>
                                        <PaginationContent className="gap-1">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage > 1) {
                                                            setCurrentPage(currentPage - 1);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "min-w-[80px] h-8 text-xs",
                                                        currentPage === 1
                                                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                                                            : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                    )}
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                if (
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setCurrentPage(page);
                                                                }}
                                                                isActive={currentPage === page}
                                                                className={cn(
                                                                    "min-w-[32px] h-8 text-xs flex items-center justify-center",
                                                                    currentPage === page
                                                                        ? "bg-primary text-primary-foreground font-semibold"
                                                                        : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                                )}
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <span className="px-1 py-1 text-muted-foreground text-xs">...</span>
                                                        </PaginationItem>
                                                    );
                                                }
                                                return null;
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage < totalPages) {
                                                            setCurrentPage(currentPage + 1);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "min-w-[80px] h-8 text-xs",
                                                        currentPage === totalPages
                                                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                                                            : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                    )}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>

                                    <div className="text-xs text-muted-foreground">
                                        Trang {currentPage}/{totalPages}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Full width mode: horizontal layout with pagination
    return (
        <div className="space-y-4">
            <div className='flex items-center justify-between'>
                <h1 className='font-medium text-lg'>{title}</h1>
                <Badge variant="outline">{tasks?.length}</Badge>
            </div>

            {tasks.length === 0 ? (
                <div className='text-center text-sm text-muted-foreground py-12 bg-muted/30 rounded-lg'>
                    Chưa có task nào
                </div>
            ) : (
                <>
                    {/* Horizontal Scrollable Tasks */}
                    <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
                        <div className="flex gap-4 min-w-max">
                            {paginatedTasks.map((task) => (
                                <div key={task.id} className="w-[300px] md:w-[320px] flex-shrink-0">
                                    <TaskCard
                                        task={task}
                                        onClick={() => onTaskClick(task.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination */}
                    {tasks.length > 0 && (
                        <div className="flex flex-col items-center gap-4 pt-4 border-t">
                            <Pagination>
                                <PaginationContent className="gap-2">
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage > 1) {
                                                    setCurrentPage(currentPage - 1);
                                                }
                                            }}
                                            className={cn(
                                                "min-w-[100px]",
                                                currentPage === 1
                                                    ? "pointer-events-none opacity-50 cursor-not-allowed"
                                                    : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                            )}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentPage(page);
                                                        }}
                                                        isActive={currentPage === page}
                                                        className={cn(
                                                            "min-w-[40px] h-10 flex items-center justify-center",
                                                            currentPage === page
                                                                ? "bg-primary text-primary-foreground font-semibold"
                                                                : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                        )}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return (
                                                <PaginationItem key={page}>
                                                    <span className="px-2 py-2 text-muted-foreground">...</span>
                                                </PaginationItem>
                                            );
                                        }
                                        return null;
                                    })}

                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage < totalPages) {
                                                    setCurrentPage(currentPage + 1);
                                                }
                                            }}
                                            className={cn(
                                                "min-w-[100px]",
                                                currentPage === totalPages
                                                    ? "pointer-events-none opacity-50 cursor-not-allowed"
                                                    : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                            )}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>

                            {/* Results info */}
                            <div className="text-sm text-muted-foreground">
                                Trang {currentPage} / {totalPages} • Hiển thị {startIndex + 1}-{Math.min(endIndex, tasks.length)} trong tổng số {tasks.length} task
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

interface TaskStatusGroupProps {
    status: string;
    statusLabel: string;
    tasks: Task[];
    onTaskClick: (taskId: string) => void;
    expandedStatuses: Record<string, boolean>;
    statusPages: Record<string, number>;
    onToggle: (status: string) => void;
    onPageChange: (status: string, page: number) => void;
}

const TASKS_PER_PAGE_STATUS = 3;

const TaskStatusGroup = ({
    status,
    statusLabel,
    tasks,
    onTaskClick,
    expandedStatuses,
    statusPages,
    onToggle,
    onPageChange
}: TaskStatusGroupProps) => {
    const isExpanded = expandedStatuses[status] !== false;
    const currentPage = statusPages[status] || 1;

    const totalPages = Math.ceil(tasks.length / TASKS_PER_PAGE_STATUS);
    const startIndex = (currentPage - 1) * TASKS_PER_PAGE_STATUS;
    const endIndex = startIndex + TASKS_PER_PAGE_STATUS;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    const getStatusIcon = () => {
        switch (status) {
            case 'To Do':
                return '📋';
            case 'In Progress':
                return '🔄';
            case 'Done':
                return '✅';
            default:
                return '📝';
        }
    };

    return (
        <div className="border rounded-lg w-full">
            {/* Status Header - Clickable */}
            <div
                className="flex items-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                onClick={() => onToggle(status)}
            >
                {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <span className="text-lg">{getStatusIcon()}</span>
                <h2 className="text-lg font-semibold flex-1">{statusLabel}</h2>
                <Badge variant="outline" className="ml-auto">
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </Badge>
            </div>

            {/* Tasks Grid - Collapsible */}
            {isExpanded && (
                <div className="p-4 pt-3 space-y-4 w-full">
                    {tasks.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">Chưa có task nào</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                                {paginatedTasks.map((task: Task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onClick={() => onTaskClick(task.id)}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {tasks.length > 0 && (
                                <div className="flex flex-col items-center gap-3 pt-2 border-t">
                                    <Pagination>
                                        <PaginationContent className="gap-2">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (currentPage > 1) {
                                                            onPageChange(status, currentPage - 1);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "min-w-[100px]",
                                                        currentPage === 1
                                                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                                                            : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                    )}
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                if (
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    onPageChange(status, page);
                                                                }}
                                                                isActive={currentPage === page}
                                                                className={cn(
                                                                    "min-w-[40px] h-10 flex items-center justify-center",
                                                                    currentPage === page
                                                                        ? "bg-primary text-primary-foreground font-semibold"
                                                                        : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                                )}
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <span className="px-2 py-2 text-muted-foreground">...</span>
                                                        </PaginationItem>
                                                    );
                                                }
                                                return null;
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (currentPage < totalPages) {
                                                            onPageChange(status, currentPage + 1);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "min-w-[100px]",
                                                        currentPage === totalPages
                                                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                                                            : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                    )}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>

                                    {/* Results info */}
                                    <div className="text-xs text-muted-foreground">
                                        Trang {currentPage} / {totalPages} • Hiển thị {startIndex + 1}-{Math.min(endIndex, tasks.length)} trong tổng số {tasks.length} task
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

interface ArchivedTaskColumnProps {
    title: string;
    tasks: Task[];
    onTaskClick: (taskId: string) => void;
    onUnarchive: (taskId: string, e: React.MouseEvent) => void;
    isArchiving: boolean;
}

const ARCHIVED_TASKS_PER_PAGE = 3; // Maximum 3 tasks per page

const ArchivedTaskColumn = ({ title, tasks, onTaskClick, onUnarchive, isArchiving }: ArchivedTaskColumnProps) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination for archived tasks
    const totalPages = Math.ceil(tasks.length / ARCHIVED_TASKS_PER_PAGE);
    const startIndex = (currentPage - 1) * ARCHIVED_TASKS_PER_PAGE;
    const endIndex = startIndex + ARCHIVED_TASKS_PER_PAGE;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    // Reset to page 1 when tasks change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [tasks.length]);

    return (
        <div className="space-y-4">
            <div className='flex items-center justify-between'>
                <h1 className='font-medium'>{title}</h1>
                <Badge variant="outline">{tasks?.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {
                    paginatedTasks.length === 0 ? (
                        <div className='text-center text-sm text-muted-foreground col-span-full py-8'>
                            Không có task đã lưu trữ
                        </div>
                    ) : (
                        paginatedTasks.map((task) => (
                            <div key={task.id} className="relative">
                                <TaskCard
                                    task={task}
                                    onClick={() => onTaskClick(task.id)}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2 z-10"
                                    onClick={(e) => onUnarchive(task.id, e)}
                                    disabled={isArchiving}
                                >
                                    <Archive className="size-4 mr-2" />
                                    Bỏ Lưu Trữ
                                </Button>
                            </div>
                        ))
                    )
                }
            </div>

            {/* Pagination for archived tasks */}
            {tasks.length > 0 && (
                <div className="mt-4 flex flex-col items-center gap-3 pt-3 border-t">
                    <Pagination>
                        <PaginationContent className="gap-2">
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) {
                                            setCurrentPage(currentPage - 1);
                                        }
                                    }}
                                    className={cn(
                                        "min-w-[100px]",
                                        currentPage === 1
                                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                                            : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                    )}
                                />
                            </PaginationItem>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(page);
                                                }}
                                                isActive={currentPage === page}
                                                className={cn(
                                                    "min-w-[40px] h-10 flex items-center justify-center",
                                                    currentPage === page
                                                        ? "bg-primary text-primary-foreground font-semibold"
                                                        : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                                )}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                    return (
                                        <PaginationItem key={page}>
                                            <span className="px-2 py-2 text-muted-foreground">...</span>
                                        </PaginationItem>
                                    );
                                }
                                return null;
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) {
                                            setCurrentPage(currentPage + 1);
                                        }
                                    }}
                                    className={cn(
                                        "min-w-[100px]",
                                        currentPage === totalPages
                                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                                            : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                    )}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>

                    {/* Results info */}
                    <div className="text-xs text-muted-foreground">
                        Trang {currentPage} / {totalPages} • Hiển thị {startIndex + 1}-{Math.min(endIndex, tasks.length)} trong tổng số {tasks.length} task
                    </div>
                </div>
            )}
        </div>
    )
}

