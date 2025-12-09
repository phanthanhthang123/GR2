import { fetchData, postData } from "@/lib/fetch-utlis";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectFormData } from "@/components/project/create-project";
import { toast } from "sonner";
import { useAuth } from "@/provider/auth-context";
import type { Project, Task } from "@/type";

export const UseCreateProject = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (data: { workspaceId: string, projectData: CreateProjectFormData }) => {
            if (!user?.id) {
                throw new Error("User not authenticated");
            }
            const requestData = {
                ...data.projectData,
                created_by: user.id
            };
            return await postData(`/project/${data.workspaceId}/create-project`, requestData);
        },
        onSuccess: (data: any) => {
            toast.success("Project created successfully");
            queryClient.invalidateQueries({ queryKey: ["workspace", data.workspaceId] });
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.message || error?.message || "Failed to create project";
            toast.error(errorMessage);
        }
    })
}
export const useProjectQueryById = (projectId: string) => {
    return useQuery<{
        err: number;
        msg: string;
        project: Project;
        tasks: Task[];
        code?: string;
    }>({
        queryKey: ["project", projectId],
        queryFn: async () => {
            return await fetchData<{
                err: number;
                msg: string;
                project: Project;
                tasks: Task[];
                code?: string;
            }>(`/project/${projectId}/tasks`);
        },
        retry: false, // Don't retry on 403 errors
    })
}