import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { useEffect, useState } from "react"
import { FolderKanban, CheckSquare, Circle, Clock, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { ScrollArea } from "../ui/scroll-area"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Loader } from "../loader"
import { useGetWorkspaceProjectsDetailQuery, useGetWorkspaceTasksDetailQuery, useGetWorkspaceMembersDetailQuery, useGetWorkspaceTasksByStatusQuery } from "@/hooks/use-workspace"
import { format } from "date-fns"
import { useSearchParams } from "react-router"
import { useNavigate } from "react-router"


export const StatCard = ({ data }: { data: any }) => {
    const [searchParams] = useSearchParams();
    const workspaceId = searchParams.get('workspaceId') || '';
    const navigate = useNavigate();
    
    const [isProjectsDialogOpen, setIsProjectsDialogOpen] = useState(false);
    const [isTasksDialogOpen, setIsTasksDialogOpen] = useState(false);
    const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
    const [isToDoDialogOpen, setIsToDoDialogOpen] = useState(false);
    const [isInProgressDialogOpen, setIsInProgressDialogOpen] = useState(false);

    // Always call hooks in the same order, regardless of conditions
    const { data: projectsData, isLoading: isLoadingProjects } = useGetWorkspaceProjectsDetailQuery(workspaceId || '', isProjectsDialogOpen);
    const { data: tasksData, isLoading: isLoadingTasks } = useGetWorkspaceTasksDetailQuery(workspaceId || '', isTasksDialogOpen);
    const { data: membersData, isLoading: isLoadingMembers, error: membersError } = useGetWorkspaceMembersDetailQuery(workspaceId || '', isMembersDialogOpen);
    const { data: toDoTasksData, isLoading: isLoadingToDo } = useGetWorkspaceTasksByStatusQuery(workspaceId || '', 'To Do', isToDoDialogOpen);
    const { data: inProgressTasksData, isLoading: isLoadingInProgress } = useGetWorkspaceTasksByStatusQuery(workspaceId || '', 'In Progress', isInProgressDialogOpen);

    // Chỉ log khi data thay đổi, không log mỗi lần render
    useEffect(() => {
        if (data) {
            console.log("StatCard data:", data)
        }
    }, [data])

    const handleProjectClick = (projectId: string) => {
        if (workspaceId) {
            navigate(`/workspaces/${workspaceId}/projects/${projectId}`);
        }
    }

    const handleTaskClick = (projectId: string, taskId: string) => {
        if (workspaceId) {
            navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
        }
    }

    const getLastNameInitial = (username: string) => {
        if (!username || username.trim() === "") return "";
        const names = username.trim().split(" ").filter(name => name.length > 0);
        if (names.length === 0) return "";
        const lastName = names[names.length - 1];
        return lastName.charAt(0).toUpperCase();
    };

    return (
        <>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsProjectsDialogOpen(true)}
            >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tổng Dự Án</CardTitle>
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalProjects}</div>
                    <p className="text-xs text-muted-foreground">
                        {data?.totalProjectInProgress} đang thực hiện
                    </p>
                </CardContent>
            </Card>
            
            <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsTasksDialogOpen(true)}
            >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tổng Task</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalTasks}</div>
                    <p className="text-xs text-muted-foreground">
                        {data?.totalTaskCompleted} đã hoàn thành
                    </p>
                </CardContent>
            </Card>

            <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsMembersDialogOpen(true)}
            >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tổng Thành Viên</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalMembers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        Thành viên trong workspace
                    </p>
                </CardContent>
            </Card>

            <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsToDoDialogOpen(true)}
            >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Chưa Làm</CardTitle>
                    <Circle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalTaskToDo}</div>
                    <p className="text-xs text-muted-foreground">
                        Task đang chờ thực hiện
                    </p>
                </CardContent>
            </Card>

            <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsInProgressDialogOpen(true)}
            >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Đang Làm</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalTaskInProgress}</div>
                    <p className="text-xs text-muted-foreground">
                        Task đang thực hiện
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Projects Dialog */}
        <Dialog open={isProjectsDialogOpen} onOpenChange={setIsProjectsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Danh Sách Dự Án</DialogTitle>
                    <DialogDescription>
                        Tất cả dự án trong workspace
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] mt-4">
                    {isLoadingProjects ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader />
                        </div>
                    ) : (projectsData as any)?.response?.length > 0 ? (
                        <div className="space-y-2 pr-4">
                            {(projectsData as any)?.response?.map((project: any) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => {
                                        setIsProjectsDialogOpen(false);
                                        handleProjectClick(project.id);
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{project.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {project.status === 'Pending' ? 'Lên Kế Hoạch' : project.status === 'In Progress' ? 'Đang Thực Hiện' : 'Hoàn Thành'}
                                            </Badge>
                                            {project.members && (
                                                <span className="text-xs text-muted-foreground">
                                                    {project.members.length} thành viên
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            Chưa có dự án nào
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>

        {/* Tasks Dialog */}
        <Dialog open={isTasksDialogOpen} onOpenChange={setIsTasksDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Danh Sách Task</DialogTitle>
                    <DialogDescription>
                        Tất cả task trong workspace
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] mt-4">
                    {isLoadingTasks ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader />
                        </div>
                    ) : (tasksData as any)?.response?.length > 0 ? (
                        <div className="space-y-2 pr-4">
                            {(tasksData as any)?.response?.map((task: any) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => {
                                        setIsTasksDialogOpen(false);
                                        handleTaskClick(task.project_id || task.project?.id, task.id);
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
                                            {task.project && (
                                                <span className="text-xs text-muted-foreground">
                                                    {task.project.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            Chưa có task nào
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>

        {/* Members Dialog */}
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Thành Viên Workspace</DialogTitle>
                    <DialogDescription>
                        Danh sách tất cả thành viên trong workspace
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] mt-4">
                    {isLoadingMembers ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader />
                        </div>
                    ) : membersError ? (
                        <div className="text-center py-8 text-sm text-destructive">
                            <p>Lỗi khi tải danh sách thành viên</p>
                            <p className="text-xs mt-2 text-muted-foreground">
                                {(membersError as any)?.response?.data?.msg || (membersError as any)?.message || 'Vui lòng thử lại sau'}
                            </p>
                        </div>
                    ) : (() => {
                        // API trả về { err: 0, msg: 'OK', response: [...] }
                        const apiResponse = membersData as any;
                        const members = apiResponse?.response || [];
                        
                        if (Array.isArray(members) && members.length > 0) {
                            return (
                                <div className="space-y-2 pr-4">
                                    {members.map((member: any, index: number) => {
                                        const memberUser = member.user;
                                        if (!memberUser) {
                                            return null;
                                        }
                                        
                                        return (
                                            <div
                                                key={member.user_id || memberUser?.id || index}
                                                className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors"
                                            >
                                                <Avatar className="size-10">
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
                                                                {member.role === 'Owner' ? 'Chủ Sở Hữu' : member.role === 'Leader' ? 'Trưởng nhóm' : member.role === 'Manager' ? 'Quản lý' : 'Thành viên'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {memberUser?.email || "Không có email"}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        } else {
                            return (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    Chưa có thành viên nào
                                </div>
                            );
                        }
                    })()}
                </ScrollArea>
            </DialogContent>
        </Dialog>

        {/* To Do Tasks Dialog */}
        <Dialog open={isToDoDialogOpen} onOpenChange={setIsToDoDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Task Chưa Làm</DialogTitle>
                    <DialogDescription>
                        Danh sách task đang chờ thực hiện
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] mt-4">
                    {isLoadingToDo ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader />
                        </div>
                    ) : (toDoTasksData as any)?.response?.length > 0 ? (
                        <div className="space-y-2 pr-4">
                            {(toDoTasksData as any)?.response?.map((task: any) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => {
                                        setIsToDoDialogOpen(false);
                                        handleTaskClick(task.project_id || task.project?.id, task.id);
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
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
                                            {task.project && (
                                                <span className="text-xs text-muted-foreground">
                                                    {task.project.name}
                                                </span>
                                            )}
                                            {task.dueDate && (
                                                <span className="text-xs text-muted-foreground">
                                                    Hết hạn: {format(new Date(task.dueDate), "MMM d, yyyy")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            Không có task chưa làm
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>

        {/* In Progress Tasks Dialog */}
        <Dialog open={isInProgressDialogOpen} onOpenChange={setIsInProgressDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Task Đang Làm</DialogTitle>
                    <DialogDescription>
                        Danh sách task đang thực hiện
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] mt-4">
                    {isLoadingInProgress ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader />
                        </div>
                    ) : (inProgressTasksData as any)?.response?.length > 0 ? (
                        <div className="space-y-2 pr-4">
                            {(inProgressTasksData as any)?.response?.map((task: any) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => {
                                        setIsInProgressDialogOpen(false);
                                        handleTaskClick(task.project_id || task.project?.id, task.id);
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
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
                                            {task.project && (
                                                <span className="text-xs text-muted-foreground">
                                                    {task.project.name}
                                                </span>
                                            )}
                                            {task.dueDate && (
                                                <span className="text-xs text-muted-foreground">
                                                    Hết hạn: {format(new Date(task.dueDate), "MMM d, yyyy")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            Không có task đang làm
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
        </>
    )
}