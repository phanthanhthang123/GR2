import type { CreateTaskDialogFormData } from "@/components/task/create-task-dialog";
import { postData } from "@/lib/fetch-utlis";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export const UseCreateTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {projectId: string, taskData: CreateTaskDialogFormData}) => {
          return await postData(`/task/${data.projectId}/create-task`, data.taskData);
        },
        onSuccess: (response: any, variables: {projectId: string, taskData: CreateTaskDialogFormData}) => {
            toast.success("Task created successfully");
            // Invalidate project query to refresh the task list
            queryClient.invalidateQueries({
                queryKey : ["project", variables.projectId],
            })
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.message || "Failed to create task";
            toast.error(errorMessage);
        }
    });
}