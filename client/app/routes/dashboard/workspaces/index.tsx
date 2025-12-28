import { Button } from "@/components/ui/button";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { useGetWorkspaceQuery } from "@/hooks/use-workspace";
import type { Workspace } from "@/type";
import { Loader, PlusCircle, Users } from "lucide-react";
import { useState } from "react";
import { NoDataFound } from "@/components/workspace/no-data-found";
import { useAuth } from "@/provider/auth-context";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import {format} from "date-fns"

const Workspaces = () => {
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const { user } = useAuth();

    const { data: workspaces, isLoading } = useGetWorkspaceQuery(user?.id || "");
    // console.log(workspaces)

    if (isLoading) {
        return <Loader />
    }

    return <>
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-3xl font-bold">Không Gian Làm Việc</h2>
                <Button onClick={() => setIsCreatingWorkspace(true)}>
                    <PlusCircle className="size-4 mr-2" /> Không Gian Mới
                </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces && workspaces.length > 0 ? (
                    workspaces.map((ws) => (
                        <WorkspaceCard key={ws.id} workspace={ws} />
                    ))
                ) : (
                    <NoDataFound
                        title="Không tìm thấy không gian làm việc"
                        description="Tạo một không gian làm việc mới để bắt đầu"
                        buttonText="Tạo Không Gian Làm Việc"
                        buttonAction={() => setIsCreatingWorkspace(true)}
                    />
                )}
            </div>
        </div>

        <CreateWorkspace
            isCreatingWorkspace={isCreatingWorkspace}
            setIsCreatingWorkspace={setIsCreatingWorkspace}
        />
    </>
}
const WorkspaceCard = ({ workspace }: { workspace: Workspace }) => {
    return (
        <Link to={`/workspaces/${workspace.id}`}>
            <Card className="transition-all hover:shadow-md hover:-translate-y-1">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex gap-2">
                            <WorkspaceAvatar
                                name={workspace?.name}
                                color={workspace?.color}
                            />
                            <div className="text-xs text-muted-foreground">
                                <CardTitle>{workspace.name}</CardTitle>
                                <span>Tạo lúc {workspace?.createdAt ? format(workspace.createdAt,"MM d,yyyy h:mm a") : "Không xác định"}</span>
                            </div>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                            <Users className="size-4 mr-1"/>
                            <span className="text-xs"> {workspace?.members?.length}</span>
                        </div>
                    </div>

                    <CardDescription>
                        {workspace.description || "Chưa có mô tả"}
                    </CardDescription>

                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Xem chi tiết không gian làm việc và dự án
                        </div>
                    </CardContent>
                </CardHeader>

            </Card>
        </Link>
    )
}
export default Workspaces;