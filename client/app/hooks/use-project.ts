import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-utlis";
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
                throw new Error("Người dùng chưa được xác thực");
            }
            const requestData = {
                ...data.projectData,
                created_by: user.id
            };
            return await postData(`/project/${data.workspaceId}/create-project`, requestData);
        },
        onSuccess: (data: any) => {
            toast.success("Tạo dự án thành công");
            queryClient.invalidateQueries({ queryKey: ["workspace", data.workspaceId] });
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.message || error?.message || "Không thể tạo dự án";
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

export const useUpdateProjectTitleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { projectId: string; title: string }) => {
            return await updateData(`/project/${data.projectId}/update-title`, { title: data.title });
        },
        onSuccess: (response: any, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
            toast.success("Cập nhật tên dự án thành công");
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.msg || "Không thể cập nhật tên dự án";
            toast.error(errorMessage);
        }
    });
}

export const useUpdateProjectDescriptionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { projectId: string; description: string }) => {
            return await updateData(`/project/${data.projectId}/update-description`, { description: data.description });
        },
        onSuccess: (response: any, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
            toast.success("Cập nhật mô tả dự án thành công");
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.msg || "Không thể cập nhật mô tả dự án";
            toast.error(errorMessage);
        }
    });
}

export const useAddMemberToProjectMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { projectId: string; userId: string; role?: string }) => {
            return await postData(`/project/${data.projectId}/add-member`, { 
                userId: data.userId, 
                role: data.role || 'Developer' 
            });
        },
        onSuccess: (response: any, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
            toast.success("Thêm thành viên thành công");
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.msg || "Không thể thêm thành viên";
            toast.error(errorMessage);
        }
    });
}

export const useRemoveMemberFromProjectMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { projectId: string; userId: string }) => {
            return await deleteData(`/project/${data.projectId}/remove-member/${data.userId}`);
        },
        onSuccess: (response: any, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
            toast.success("Xóa thành viên thành công");
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.msg || "Không thể xóa thành viên";
            toast.error(errorMessage);
        }
    });
}