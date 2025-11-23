import { fetchData, postData } from "@/lib/fetch-utlis";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CreateWorkspaceSchema } from "@/lib/schema";
import type { Workspace } from "@/type";
import z from "zod";


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