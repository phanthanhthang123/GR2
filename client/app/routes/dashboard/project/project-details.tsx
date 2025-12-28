import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router';
import type { Task } from '@/type';
import { useProjectQueryById, useUpdateProjectTitleMutation, useUpdateProjectDescriptionMutation, useAddMemberToProjectMutation, useRemoveMemberFromProjectMutation } from '@/hooks/use-project';
import type { TaskStatus } from '@/type';
import { Loader } from '@/components/loader';
import { getProjectProgress } from '@/lib';
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
import { Archive, CheckSquare, Users, Edit, Trash2, UserPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/provider/auth-context';
import { useGetAllUsersQuery } from '@/hooks/use-workspace';
import { useMemo } from 'react';

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
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const { user } = useAuth();

    // All hooks must be called before any conditional returns
    const { data, isLoading, error } = useProjectQueryById(projectId!);
    const queryClient = useQueryClient();
    const { mutate: archiveTask, isPending: isArchiving } = useArchiveTaskMutation();
    const { mutate: updateTitle, isPending: isUpdatingTitle } = useUpdateProjectTitleMutation();
    const { mutate: updateDescription, isPending: isUpdatingDescription } = useUpdateProjectDescriptionMutation();
    const { mutate: addMember, isPending: isAddingMember } = useAddMemberToProjectMutation();
    const { mutate: removeMember, isPending: isRemovingMember } = useRemoveMemberFromProjectMutation();
    const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersQuery(searchQuery);
    
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

    const { project, tasks } = data;
    console.log("task", tasks)
    
    // All hooks and memoized values must be called before any conditional returns
    // Filter out archived tasks from main view
    const activeTasks = tasks?.filter(task => !task.isArchived) || [];
    const archivedTasks = tasks?.filter(task => task.isArchived) || [];
    
    const projectProgess = getProjectProgress(activeTasks as { status: TaskStatus }[]);
    
    // Get project statistics
    const totalTasksInProject = tasks?.length || 0;
    const totalMembersInProject = (project as any)?.members?.length || 0;

    // Check if current user is leader - must be called before early return
    const isCurrentUserLeader = useMemo(() => {
        if (!user || !project) return false;
        const leaderId = typeof (project as any).leader_id === 'string' 
            ? (project as any).leader_id 
            : (project as any).leader?.id || (project as any).leader_id;
        if (leaderId === user.id || (project as any).created_by === user.id) return true;
        return (project as any)?.members?.some((member: any) => {
            const memberUserId = typeof member.user === 'string' ? member.user : member.user?.id || member.user_id;
            return memberUserId === user.id && member.role === 'Leader';
        }) || false;
    }, [user, project]);

    // Initialize title and description
    useEffect(() => {
        if (project && !isEditingTitle) {
            setNewTitle(project.name || '');
        }
        if (project && !isEditingDescription) {
            setNewDescription(project.description || '');
        }
    }, [project, isEditingTitle, isEditingDescription]);

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

    // Filter available users (not already members) - must be called before early return
    const availableUsers = useMemo(() => {
        const users = (usersData as any)?.response || [];
        if (!users || users.length === 0 || !project) return [];
        const existingMemberIds = ((project as any)?.members || []).map((m: any) => 
            typeof m.user === 'string' ? m.user : m.user?.id || m.user_id
        );
        return users.filter((user: any) => !existingMemberIds.includes(user.id));
    }, [usersData, project]);

    // Early return after all hooks and memoized values
    if (!project) {
        return (
            <div>
                <p>Không tìm thấy dự án</p>
            </div>
        )
    }

    const handleTaskClick = (taskId: string) => {
        navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
    }

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
        <div className='space-y-8'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex-1'>
                    <BackButton />
                    <div className='flex flex-col gap-2 mt-2'>
                        <div className='flex items-center gap-2'>
                            {isEditingTitle ? (
                                <Input
                                    className="text-xl md:text-2xl font-bold"
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
                                    <h1 className='text-xl md:text-2xl font-bold'>{project?.name}</h1>
                                    {isCurrentUserLeader && (
                                        <button
                                            type="button"
                                            onClick={handleEditTitle}
                                            className="inline-flex items-center rounded-md border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                                        >
                                            <Edit className="mr-1 size-3" />
                                            Sửa
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        {isEditingTitle && (
                            <div className="flex items-center gap-2">
                                <Button
                                    className="py-0 px-3"
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
                    <div className='flex flex-col gap-2 mt-2'>
                        {isEditingDescription ? (
                            <>
                                <Textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className='text-sm text-gray-500 min-h-[60px]'
                                    disabled={isUpdatingDescription}
                                    placeholder="Nhập mô tả dự án..."
                                    autoFocus
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        className="py-0 px-3"
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
                                    <p className='text-sm text-gray-500'>{project?.description}</p>
                                ) : (
                                    <p className='text-sm text-gray-400 italic'>Chưa có mô tả</p>
                                )}
                                {isCurrentUserLeader && (
                                    <button
                                        type="button"
                                        onClick={handleEditDescription}
                                        className="inline-flex items-center rounded-md border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                                    >
                                        <Edit className="mr-1 size-3" />
                                        Sửa
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex flex-col sm:flex-row gap-3'>
                    <div className='flex items-center gap-2 min-w-32'>
                        <div className='text-sm text-muted-foreground'>Tiến độ: </div>
                        <div className='flex-1'>
                            <Progress value={projectProgess ? projectProgess : 0} className='h-2' />
                        </div>
                        <span className='text-sm text-muted-foreground'>{projectProgess ? projectProgess : 0}%</span>
                    </div>

                    <div className='flex gap-2'>
                        {isCurrentUserLeader && (
                            <Button 
                                variant="outline"
                                onClick={() => setIsAddMemberDialogOpen(true)}
                            >
                                <UserPlus className="mr-2 size-4" />
                                Thêm Thành Viên
                            </Button>
                        )}
                        <Button onClick={() => setIsCreateTask(true)}>Thêm Task</Button>
                    </div>
                </div>
            </div>

            {/* Project Statistics */}
            <div className='grid grid-cols-2 gap-2'>
                <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setIsTaskDialogOpen(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-medium">Tổng Task</CardTitle>
                        <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold">{totalTasksInProject}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Task trong dự án
                        </p>
                    </CardContent>
                </Card>

                <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setIsMemberDialogOpen(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-medium">Thành Viên</CardTitle>
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold">{totalMembersInProject}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Thành viên trong dự án
                        </p>
                    </CardContent>
                </Card>
            </div>

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
                                            <p className="text-sm font-medium truncate">{task.title}</p>
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
                                    const isLeader = member.role === 'Leader' || (project as any).leader_id === memberUserId;
                                    const canDelete = isCurrentUserLeader && !isLeader && memberUserId !== user?.id;
                                    
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
                                                    {member.role && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {member.role === 'Leader' ? 'Trưởng nhóm' : member.role === 'Manager' ? 'Quản lý' : 'Thành viên'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {memberUser?.email || "Không có email"}
                                                </p>
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
                                        return (
                                            <div
                                                key={userItem.id}
                                                onClick={() => setSelectedUserId(userItem.id)}
                                                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer border transition-colors ${
                                                    isSelected
                                                        ? "bg-primary/10 border-primary"
                                                        : "hover:bg-accent border-transparent"
                                                }`}
                                            >
                                                <Avatar className="size-8">
                                                    <AvatarImage src={userItem.avatarUrl || undefined} />
                                                    <AvatarFallback>
                                                        {userItem.username?.charAt(0).toUpperCase() || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{userItem.username}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{userItem.email}</p>
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

            <div className='flex items-center justify-between'>
                <Tabs defaultValue='all' className='w-full'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
                        <TabsList>
                            <TabsTrigger value='all' onClick={() => setTaskFilter('All')}>
                                Tất Cả
                            </TabsTrigger>
                            <TabsTrigger value='todo' onClick={() => setTaskFilter('To Do')}>
                                Chưa Làm
                            </TabsTrigger>
                            <TabsTrigger value='in-progress' onClick={() => setTaskFilter('In Progress')}>
                                Đang Làm
                            </TabsTrigger>
                            <TabsTrigger value='done' onClick={() => setTaskFilter('Done')}>
                                Hoàn Thành
                            </TabsTrigger>
                            <TabsTrigger value='archived' onClick={() => setTaskFilter('Archived')}>
                                Đã Lưu Trữ ({archivedTasks.length})
                            </TabsTrigger>
                        </TabsList>

                        <div className='flex items-center text-sm'>
                            <span className='text-muted-foreground'>Trạng thái: </span>
                            <div>
                                <Badge
                                    variant='outline'
                                    className='bg-background'
                                >
                                    {activeTasks?.filter(task => task.status === 'To Do').length} Chưa Làm
                                </Badge>

                                <Badge
                                    variant='outline'
                                    className='bg-background'
                                >
                                    {activeTasks?.filter(task => task.status === 'In Progress').length} Đang Làm
                                </Badge>

                                <Badge
                                    variant='outline'
                                    className='bg-background'
                                >
                                    {activeTasks?.filter(task => task.status === 'Done').length} Hoàn Thành
                                </Badge>

                            </div>
                        </div>
                    </div>

                    <TabsContent value='all' className='m-0'>
                        <div className='grid grid-cols-3 gap-4'>
                            <TaskColumn
                                title="Chưa Làm"
                                tasks={activeTasks?.filter(task => task.status === 'To Do')}
                                onTaskClick={handleTaskClick}
                            />
                            <TaskColumn
                                title="Đang Làm"
                                tasks={activeTasks?.filter(task => task.status === 'In Progress')}
                                onTaskClick={handleTaskClick}
                            />
                            <TaskColumn
                                title="Hoàn Thành"
                                tasks={activeTasks?.filter(task => task.status === 'Done')}
                                onTaskClick={handleTaskClick}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value='todo' className='m-0'>
                        <div className='grid md:grid-cols-1 gap-4'>
                            <TaskColumn
                                title="Chưa Làm"
                                tasks={activeTasks?.filter(task => task.status === 'To Do')}
                                onTaskClick={handleTaskClick}
                                isFullWidth
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value='in-progress' className='m-0'>
                        <div className='grid md:grid-cols-1 gap-4'>
                            <TaskColumn
                                title="Đang Làm"
                                tasks={activeTasks?.filter(task => task.status === 'In Progress')}
                                onTaskClick={handleTaskClick}
                                isFullWidth
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value='done' className='m-0'>
                        <div className='grid md:grid-cols-1 gap-4'>
                            <TaskColumn
                                title="Hoàn Thành"
                                tasks={activeTasks?.filter(task => task.status === 'Done')}
                                onTaskClick={handleTaskClick}
                                isFullWidth
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value='archived' className='m-0'>
                        <div className='grid md:grid-cols-1 gap-4'>
                            <ArchivedTaskColumn
                                title="Task Đã Lưu Trữ"
                                tasks={archivedTasks}
                                onTaskClick={handleTaskClick}
                                onUnarchive={handleUnarchiveTask}
                                isArchiving={isArchiving}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>


            {/* Create Task Dialog */}
            <CreateTaskDialog
                open={isCreateTask}
                onOpenChange={setIsCreateTask}
                projectId={projectId!}
                projectMembers={(project as any)?.members || []}
            />
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

const TaskColumn = ({ title, tasks, onTaskClick, isFullWidth = false }: TaskColumnProps) => {
    return (
        <div className={
            isFullWidth ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : ''
        }>
            <div
                className={cn(
                    "space-y-4",
                    !isFullWidth ? "h-full" : "col-span-full mb-4"
                )}
            >
                <div className='flex items-center justify-between'>
                    <h1 className='font-medium'>{title}</h1>
                    <Badge variant="outline">{tasks?.length}</Badge>
                </div>

                <div
                    className={cn(
                        "space-y-3",
                        isFullWidth && "grid grid-cols-2 lg:grid-cols-3 gap-4"
                    )}
                >
                    {
                        tasks.length === 0 ? (
                            <div className='text-center text-sm text-muted-foreground'>
                                Chưa có task nào
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={() => onTaskClick(task.id)}
                                />
                            ))
                        )
                    }
                </div>

            </div>
        </div>
    )
}

interface ArchivedTaskColumnProps {
    title: string;
    tasks: Task[];
    onTaskClick: (taskId: string) => void;
    onUnarchive: (taskId: string, e: React.MouseEvent) => void;
    isArchiving: boolean;
}

const ArchivedTaskColumn = ({ title, tasks, onTaskClick, onUnarchive, isArchiving }: ArchivedTaskColumnProps) => {
    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div className="space-y-4 col-span-full mb-4">
                <div className='flex items-center justify-between'>
                    <h1 className='font-medium'>{title}</h1>
                    <Badge variant="outline">{tasks?.length}</Badge>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {
                        tasks.length === 0 ? (
                            <div className='text-center text-sm text-muted-foreground col-span-full py-8'>
                                Không có task đã lưu trữ
                            </div>
                        ) : (
                            tasks.map((task) => (
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
            </div>
        </div>
    )
}
