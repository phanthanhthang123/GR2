import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router';
import type { Task } from '@/type';
import { useProjectQueryById } from '@/hooks/use-project';
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
import { Archive } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const ProjectDetails = () => {

    const { projectId, workspaceId } = useParams<{ projectId: string, workspaceId: string }>();
    const navigate = useNavigate();

    const [isCreateTask, setIsCreateTask] = useState(false);
    const [taskFilter, setTaskFilter] = useState<'All' | 'To Do' | 'In Progress' | 'Done' | 'Archived'>('All');

    const { data, isLoading, error } = useProjectQueryById(projectId!);
    const queryClient = useQueryClient();
    const { mutate: archiveTask, isPending: isArchiving } = useArchiveTaskMutation();
    
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
            toast.error("Failed to load project");
        }
    }, [error, navigate, workspaceId]);

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
                <p>Failed to load project</p>
            </div>
        )
    }

    const { project, tasks } = data;
    console.log("task", tasks)
    if (!project) {
        return (
            <div>
                <p>Project not found</p>
            </div>
        )
    }
    
    // Filter out archived tasks from main view
    const activeTasks = tasks?.filter(task => !task.isArchived) || [];
    const archivedTasks = tasks?.filter(task => task.isArchived) || [];
    
    const projectProgess = getProjectProgress(activeTasks as { status: TaskStatus }[]);

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
                <div>
                    <BackButton />
                    <div className='flex items-center gap-3'>
                        <h1 className='text-xl md:text-2xl font-bold'>{project?.name}</h1>
                    </div>
                    {
                        project?.description && (
                            <p className='text-sm text-gray-500'>{project?.description}</p>
                        )
                    }
                </div>

                <div className='flex flex-col sm:flex-row gap-3'>
                    <div className='flex items-center gap-2 min-w-32'>
                        <div className='text-sm text-muted-foreground'>Progress: </div>
                        <div className='flex-1'>
                            <Progress value={projectProgess ? projectProgess : 0} className='h-2' />
                        </div>
                        <span className='text-sm text-muted-foreground'>{projectProgess ? projectProgess : 0}%</span>
                    </div>

                    <Button onClick={() => setIsCreateTask(true)}>Add Task</Button>
                </div>
            </div>

            <div className='flex items-center justify-between'>
                <Tabs defaultValue='all' className='w-full'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
                        <TabsList>
                            <TabsTrigger value='all' onClick={() => setTaskFilter('All')}>
                                All Tasks
                            </TabsTrigger>
                            <TabsTrigger value='todo' onClick={() => setTaskFilter('To Do')}>
                                To Do
                            </TabsTrigger>
                            <TabsTrigger value='in-progress' onClick={() => setTaskFilter('In Progress')}>
                                In Progress
                            </TabsTrigger>
                            <TabsTrigger value='done' onClick={() => setTaskFilter('Done')}>
                                Done
                            </TabsTrigger>
                            <TabsTrigger value='archived' onClick={() => setTaskFilter('Archived')}>
                                Archived ({archivedTasks.length})
                            </TabsTrigger>
                        </TabsList>

                        <div className='flex items-center text-sm'>
                            <span className='text-muted-foreground'>Status: </span>
                            <div>
                                <Badge
                                    variant='outline'
                                    className='bg-background'
                                >
                                    {activeTasks?.filter(task => task.status === 'To Do').length} To Do
                                </Badge>

                                <Badge
                                    variant='outline'
                                    className='bg-background'
                                >
                                    {activeTasks?.filter(task => task.status === 'In Progress').length} In Progress
                                </Badge>

                                <Badge
                                    variant='outline'
                                    className='bg-background'
                                >
                                    {activeTasks?.filter(task => task.status === 'Done').length} Done
                                </Badge>

                            </div>
                        </div>
                    </div>

                    <TabsContent value='all' className='m-0'>
                        <div className='grid grid-cols-3 gap-4'>
                            <TaskColumn
                                title="To Do"
                                tasks={activeTasks?.filter(task => task.status === 'To Do')}
                                onTaskClick={handleTaskClick}
                            />
                            <TaskColumn
                                title="In Progress"
                                tasks={activeTasks?.filter(task => task.status === 'In Progress')}
                                onTaskClick={handleTaskClick}
                            />
                            <TaskColumn
                                title="Done"
                                tasks={activeTasks?.filter(task => task.status === 'Done')}
                                onTaskClick={handleTaskClick}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value='todo' className='m-0'>
                        <div className='grid md:grid-cols-1 gap-4'>
                            <TaskColumn
                                title="To Do"
                                tasks={activeTasks?.filter(task => task.status === 'To Do')}
                                onTaskClick={handleTaskClick}
                                isFullWidth
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value='in-progress' className='m-0'>
                        <div className='grid md:grid-cols-1 gap-4'>
                            <TaskColumn
                                title="In Progress"
                                tasks={activeTasks?.filter(task => task.status === 'In Progress')}
                                onTaskClick={handleTaskClick}
                                isFullWidth
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value='done' className='m-0'>
                        <div className='grid md:grid-cols-1 gap-4'>
                            <TaskColumn
                                title="Done"
                                tasks={activeTasks?.filter(task => task.status === 'Done')}
                                onTaskClick={handleTaskClick}
                                isFullWidth
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value='archived' className='m-0'>
                        <div className='grid md:grid-cols-1 gap-4'>
                            <ArchivedTaskColumn
                                title="Archived Tasks"
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
                                No tasks yet
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
                                No archived tasks
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
                                        Unarchive
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
