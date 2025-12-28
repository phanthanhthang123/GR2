import type { CreateTaskDialogFormData } from "@/components/task/create-task-dialog";
import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-utlis";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Task, TaskPriority, TaskStatus, Comment } from "@/type";


export const UseCreateTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { projectId: string, taskData: CreateTaskDialogFormData }) => {
            return await postData(`/task/${data.projectId}/create-task`, data.taskData);
        },
        onSuccess: (response: any, variables: { projectId: string, taskData: CreateTaskDialogFormData }) => {
            toast.success("Tạo task thành công");
            // Invalidate project query to refresh the task list
            queryClient.invalidateQueries({
                queryKey: ["project", variables.projectId],
            })
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.msg || "Không thể tạo task";
            toast.error(errorMessage);
        }
    });
}

export const useTaskByIdQuery = (taskId: string) => {
    return useQuery<Task>({
        queryKey: ["task", taskId],
        queryFn: async () => {
            const res = await fetchData<{
                err: number;
                msg: string;
                response: Task;
            }>(`/task/${taskId}`);
            return res?.response;
        }
    })
}

export const useUpdateTaskTitleMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { taskId: string, title: string }) => {
            return await updateData(`/task/${data.taskId}/update-title`, { title: data.title });
        },
        onSuccess: async (response: any, variables: { taskId: string, title: string }) => {
            // Update cache immediately with new data
            if (response?.response) {
                // Create a new object to ensure React detects the change
                const updatedTask: Task = {
                    ...response.response,
                    id: String(response.response.id), // Ensure id is string to match query key
                    title: response.response.title || variables.title
                };
                queryClient.setQueryData<Task>(["task", variables.taskId], updatedTask);
            }
            // Refetch to ensure we have the latest data from server
            await queryClient.refetchQueries({ 
                queryKey: ["task", variables.taskId],
                type: 'active'
            });
            // Refetch activity query immediately to show new activity
            await queryClient.refetchQueries({
                queryKey: ["task-activity", String(variables.taskId)],
                type: 'active'
            });
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.msg || "Không thể cập nhật tiêu đề task";
            toast.error(errorMessage);
        }
    })
}

export const useUpdateTaskStatusMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { taskId: string, status: TaskStatus }) => {
            return await updateData(`/task/${data.taskId}/update-status`, { status: data.status });
        },
        onSuccess: async (response: any, variables: { taskId: string, status: TaskStatus }) => {
            // Update cache immediately with new data
            if (response?.response) {
                // Create a new object to ensure React detects the change
                const updatedTask: Task = {
                    ...response.response,
                    id: String(response.response.id), // Ensure id is string to match query key
                    status: response.response.status || variables.status
                };
                queryClient.setQueryData<Task>(["task", variables.taskId], updatedTask);
            }
            // Refetch to ensure we have the latest data from server
            await queryClient.refetchQueries({ 
                queryKey: ["task", variables.taskId],
                type: 'active'
            });
            // Refetch activity query immediately to show new activity
            await queryClient.refetchQueries({
                queryKey: ["task-activity", String(variables.taskId)],
                type: 'active'
            });
        }
    })
}

export const useUpdateDescriptionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { taskId: string, description: string }) => {
            return await updateData(`/task/${data.taskId}/update-description`, { description: data.description });
        },
        onSuccess: async (response: any, variables: { taskId: string, description: string }) => {
            // Update cache immediately with new data
            if (response?.response) {
                // Create a new object to ensure React detects the change
                const updatedTask: Task = {
                    ...response.response,
                    id: String(response.response.id), // Ensure id is string to match query key
                    description: response.response.description || variables.description
                };
                queryClient.setQueryData<Task>(["task", variables.taskId], updatedTask);
            }
            // Refetch to ensure we have the latest data from server
            await queryClient.refetchQueries({ 
                queryKey: ["task", variables.taskId],
                type: 'active'
            });
            // Refetch activity query immediately to show new activity
            await queryClient.refetchQueries({
                queryKey: ["task-activity", String(variables.taskId)],
                type: 'active'
            });
        }
    })
}

export const useUpdateTaskAssigneesMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { taskId: string; assignees: string[] }) => {
            return await updateData(`/task/${data.taskId}/update-assignees`, {
                assignees: data.assignees,
            });
        },
        onSuccess: async (response: any, variables: { taskId: string; assignees: string[] }) => {
            // Update cache immediately with new data
            if (response?.response) {
                const updatedTask: Task = {
                    ...response.response,
                    id: String(response.response.id),
                    assigned_to: response.response.assigned_to || variables.assignees[0] || null
                };
                queryClient.setQueryData<Task>(["task", variables.taskId], updatedTask);
            }
            // Refetch to ensure we have the latest data from server
            await queryClient.refetchQueries({ 
                queryKey: ["task", variables.taskId],
                type: 'active'
            });
            // Refetch activity query immediately to show new activity
            await queryClient.refetchQueries({
                queryKey: ["task-activity", String(variables.taskId)],
                type: 'active'
            });
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.message || "Không thể cập nhật người được giao";
            toast.error(errorMessage);
        }
    })
}

export const useUpdateTaskPriorityMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { taskId: string, priority: TaskPriority | undefined }) => {
            return await updateData(`/task/${data.taskId}/update-priority`, { priority: data.priority });
        },
        onSuccess: async (response: any, variables: { taskId: string, priority: TaskPriority | undefined }) => {
            // Update cache immediately with new data
            if (response?.response) {
                const updatedTask: Task = {
                    ...response.response,
                    id: String(response.response.id),
                    priority: response.response.priority || variables.priority
                };
                queryClient.setQueryData<Task>(["task", variables.taskId], updatedTask);
            }
            // Refetch to ensure we have the latest data from server
            await queryClient.refetchQueries({ 
                queryKey: ["task", variables.taskId],
                type: 'active'
            });
            // Refetch activity query immediately to show new activity
            await queryClient.refetchQueries({
                queryKey: ["task-activity", String(variables.taskId)],
                type: 'active'
            });
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.message || "Không thể cập nhật độ ưu tiên";
            toast.error(errorMessage);
        }
    })
}

// COMMENT HOOKS
export const useCommentsQuery = (taskId: string) => {
    return useQuery<Comment[]>({
        queryKey: ["comments", taskId],
        queryFn: async () => {
            const res = await fetchData<{
                err: number;
                msg: string;
                response: Comment[];
            }>(`/task/${taskId}/comments`);
            return res?.response || [];
        },
        enabled: !!taskId,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });
};

export const useAddCommentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { taskId: string, content: string }) => {
            return await postData(`/task/${data.taskId}/comments`, { content: data.content });
        },
        onSuccess: async (response: any, variables: { taskId: string, content: string }) => {
            // Refetch comments
            await queryClient.refetchQueries({
                queryKey: ["comments", variables.taskId],
                type: 'active'
            });
            // Refetch activity to show new comment activity
            await queryClient.refetchQueries({
                queryKey: ["task-activity", variables.taskId],
                type: 'active'
            });
            toast.success("Thêm bình luận thành công");
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.msg || "Không thể thêm bình luận";
            toast.error(errorMessage);
        }
    });
};

export const useEditCommentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { commentId: string | number, content: string, taskId: string }) => {
            return await updateData(`/task/comments/${data.commentId}`, { content: data.content });
        },
        onSuccess: async (response: any, variables: { commentId: string | number, content: string, taskId: string }) => {
            // Refetch comments
            await queryClient.refetchQueries({
                queryKey: ["comments", variables.taskId],
                type: 'active'
            });
            // Refetch activity to show new comment edit activity
            await queryClient.refetchQueries({
                queryKey: ["task-activity", variables.taskId],
                type: 'active'
            });
            toast.success("Cập nhật bình luận thành công");
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.msg || "Không thể cập nhật bình luận";
            toast.error(errorMessage);
        }
    });
};

export const useDeleteCommentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { commentId: string | number, taskId: string }) => {
            return await deleteData(`/task/comments/${data.commentId}`);
        },
        onSuccess: async (response: any, variables: { commentId: string | number, taskId: string }) => {
            // Refetch comments
            await queryClient.refetchQueries({
                queryKey: ["comments", variables.taskId],
                type: 'active'
            });
            toast.success("Xóa bình luận thành công");
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.msg || "Không thể xóa bình luận";
            toast.error(errorMessage);
        }
    });
}

export const useWatchTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { taskId: string }) => {
            return await postData(`/task/${data.taskId}/watch`, {});
        },
        onSuccess: async (response: any, variables: { taskId: string }) => {
            // Ensure taskId is string for query key consistency
            const taskIdStr = String(variables.taskId);
            
            // Update cache immediately with new data
            if (response?.response) {
                const updatedTask: Task = {
                    ...response.response,
                    id: String(response.response.id),
                };
                queryClient.setQueryData<Task>(["task", taskIdStr], updatedTask);
            }
            
            // Invalidate and refetch to ensure we have the latest data from server
            await queryClient.invalidateQueries({
                queryKey: ["task", taskIdStr],
            });
            
            // Invalidate activity query to show new activity
            await queryClient.invalidateQueries({
                queryKey: ["task-activity", taskIdStr],
            });
            
            // Show success message based on watch status
            const isWatching = response?.isWatching;
            toast.success(isWatching ? "Bạn đang theo dõi task này" : "Bạn đã dừng theo dõi task này");
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.msg || "Không thể cập nhật trạng thái theo dõi";
            toast.error(errorMessage);
        }
    })
}

export const useAchievedTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { taskId: string }) => {
            return await postData(`/task/${data.taskId}/achieved`, {});
        },
        onSuccess: async (response: any, variables: { taskId: string }) => {
            // Ensure taskId is string for query key consistency
            const taskIdStr = String(variables.taskId);
            
            // Update cache immediately with new data
            if (response?.response) {
                const updatedTask: Task = {
                    ...response.response,
                    id: String(response.response.id),
                    status: 'Done' as TaskStatus
                };
                queryClient.setQueryData<Task>(["task", taskIdStr], updatedTask);
            }
            
            // Invalidate and refetch to ensure we have the latest data from server
            await queryClient.invalidateQueries({
                queryKey: ["task", taskIdStr],
            });
            
            // Invalidate activity query to show new activity
            await queryClient.invalidateQueries({
                queryKey: ["task-activity", taskIdStr],
            });
            
            toast.success("Task đã được đánh dấu hoàn thành!");
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.msg || "Không thể đánh dấu task là hoàn thành";
            toast.error(errorMessage);
        }
    })
}

export const useArchiveTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { taskId: string }) => {
            return await postData(`/task/${data.taskId}/archive`, {});
        },
        onSuccess: async (response: any, variables: { taskId: string }) => {
            // Ensure taskId is string for query key consistency
            const taskIdStr = String(variables.taskId);
            
            // Update cache immediately with new data
            if (response?.response) {
                const updatedTask: Task = {
                    ...response.response,
                    id: String(response.response.id),
                    isArchived: response.isArchived ?? response.response.isArchived
                };
                queryClient.setQueryData<Task>(["task", taskIdStr], updatedTask);
            }
            
            // Invalidate and refetch to ensure we have the latest data from server
            await queryClient.invalidateQueries({
                queryKey: ["task", taskIdStr],
            });
            
            // Invalidate activity query to show new activity
            await queryClient.invalidateQueries({
                queryKey: ["task-activity", taskIdStr],
            });
            
            // Invalidate project query if task has project_id
            if (response?.response?.project_id) {
                await queryClient.invalidateQueries({
                    queryKey: ["project", response.response.project_id],
                });
            } else if (response?.response?.project) {
                const projectId = typeof response.response.project === 'string' 
                    ? response.response.project 
                    : response.response.project?.id;
                if (projectId) {
                    await queryClient.invalidateQueries({
                        queryKey: ["project", projectId],
                    });
                }
            }
            
            // Show success message based on archive status
            const isArchived = response?.isArchived ?? response?.response?.isArchived;
            toast.success(isArchived ? "Lưu trữ task thành công" : "Bỏ lưu trữ task thành công");
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.msg || "Không thể lưu trữ/bỏ lưu trữ task";
            toast.error(errorMessage);
        }
    })
}