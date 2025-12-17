import { fetchData, postData, deleteData } from "@/lib/fetch-utlis";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CreateWorkspaceSchema } from "@/lib/schema";
import type { Workspace } from "@/type";
import z from "zod";
import { toast } from "sonner";


export const useCreateWorkspaceMutation = () => {
    const { t } = useTranslation();
    const WorkspaceSchema = CreateWorkspaceSchema(t);
    type WorkspaceForm = z.infer<typeof WorkspaceSchema>;

    return useMutation({
        mutationFn: async (data: WorkspaceForm & { owner_id: string }) => {
            return postData("/workspace/create", data);
        }
    })
}


export const useGetWorkspaceQuery = (user_id: string)=>{
    return useQuery({
        queryKey: ["workspaces", user_id],
        queryFn: async ()=> {
            const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
            return postData<Workspace[]>("/workspace/list-workspace-by-user", { user_id: userInfo.id });
        },
        enabled: !!user_id
    })
}

export const useGetWorkspaceQueryById = (workspace_id: string)=>{
    return useQuery({
        queryKey: ["workspace", workspace_id],
        queryFn: async ()=> {
            return fetchData(`/workspace/get-by-id/${ workspace_id }/projects`);
        },
        enabled: !!workspace_id
    })
}

export const useAddMemberToWorkspaceMutation = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: { workspaceId: string; email?: string; userId?: string; role: string }) => {
            return await postData(`/workspace/${data.workspaceId}/add-member`, {
                email: data.email,
                userId: data.userId,
                role: data.role
            });
        },
        onSuccess: (response: any, variables: { workspaceId: string; email?: string; userId?: string; role: string }) => {
            // Invalidate workspace query to refresh the member list
            queryClient.invalidateQueries({
                queryKey: ["workspace", variables.workspaceId],
            });
        },
        // Don't show toast here when called from component (component will handle it)
        // onError: (error: any) => {
        //     const errorMessage = (error as any)?.response?.data?.msg || "Failed to add member";
        //     toast.error(errorMessage);
        // }
    });
}

export const useGetAllUsersQuery = (searchQuery?: string) => {
    return useQuery({
        queryKey: ["users", searchQuery],
        queryFn: async () => {
            const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
            return await fetchData(`/auth/users${params}`);
        },
        enabled: true,
        staleTime: 30000, // Cache for 30 seconds
    });
}

export const useRemoveMemberFromWorkspaceMutation = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: { workspaceId: string; userId: string }) => {
            return await deleteData(`/workspace/${data.workspaceId}/remove-member/${data.userId}`);
        },
        onSuccess: (response: any, variables: { workspaceId: string; userId: string }) => {
            // Invalidate workspace query to refresh the member list
            queryClient.invalidateQueries({
                queryKey: ["workspace", variables.workspaceId],
            });
        },
    });
}

export const useGetWorkspaceStatsQuery = (workspace_id: string)=>{
    return useQuery({
        queryKey: ["workspace-stats", workspace_id],
        queryFn: async ()=> {
            return fetchData(`/workspace/${workspace_id}/stats`);
        },
        enabled: !!workspace_id
    })
}