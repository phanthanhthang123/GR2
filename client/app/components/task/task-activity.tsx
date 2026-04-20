import { useQuery } from "@tanstack/react-query"
import { fetchData } from "@/lib/fetch-utlis"
import { Loader } from "../loader";
import type { ActivityLog } from "@/type";
import { getActivityIcon, getActivityMessage } from "./task-icon";
import { ScrollArea } from "../ui/scroll-area";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";

export const TaskActivity = ({ resourceId }: { resourceId: string }) => {

    const { data, isPending, error } = useQuery({
        queryKey: ["task-activity", resourceId],
        queryFn: () => fetchData(`/task/${resourceId}/activity`),
        staleTime: 0, // Always consider data stale to allow refetching
        refetchOnWindowFocus: true, // Refetch when window gains focus
        refetchOnMount: true, // Refetch when component mounts
    }) as {
        data: {
            response: ActivityLog[];
        };
        isPending: boolean;
        error: any;
    };

    if (isPending) {
        return (
            <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg text-muted-foreground mb-4">Hoạt động</h3>
                <Loader />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg text-muted-foreground mb-4">Hoạt động</h3>
                <p className="text-sm text-muted-foreground">Không thể tải hoạt động</p>
            </div>
        )
    }

    const activities = data?.response || [];

    return (
        <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-lg text-muted-foreground mb-4">Hoạt động</h3>

            {activities.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Chưa có hoạt động nào</p>
                </div>
            ) : (
                <ScrollArea className="h-[400px]">
                    <div className="space-y-4 pr-4">
                        {activities.map((activity: any) => (
                            <div
                                className="flex gap-2"
                                key={activity.id}
                            >
                                <div className="size-8 rounded-full bg-primary/10 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                                    {getActivityIcon(activity.action)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                        <span className="font-medium">{activity.user?.username || 'Không xác định'}</span> {" "}
                                        {getActivityMessage(activity.action)}
                                        {activity.action === 'DUE_DATE_UPDATED' && activity.payload && (
                                            <span className="text-muted-foreground">
                                                {" "}
                                                {(() => {
                                                    const payload = activity.payload;
                                                    const oldDate = payload.oldDueDate ? format(new Date(payload.oldDueDate), "dd/MM/yyyy") : "không có";
                                                    const newDate = payload.newDueDate ? format(new Date(payload.newDueDate), "dd/MM/yyyy") : "không có";
                                                    
                                                    if (!payload.oldDueDate && payload.newDueDate) {
                                                        return `(từ ${oldDate} thành ${newDate})`;
                                                    } else if (payload.oldDueDate && !payload.newDueDate) {
                                                        return `(từ ${oldDate} thành ${newDate})`;
                                                    } else if (payload.oldDueDate && payload.newDueDate) {
                                                        return `(từ ${oldDate} thành ${newDate})`;
                                                    }
                                                    return "";
                                                })()}
                                            </span>
                                        )}
                                        {activity.action === 'PULL_REQUEST_UPDATED' && activity.payload?.pullRequestUrl && (
                                            <span className="ml-2 inline-flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="h-auto p-0 text-sm"
                                                    onClick={() => {
                                                        const url = String(activity.payload.pullRequestUrl);
                                                        window.open(url, "_blank", "noopener,noreferrer");
                                                    }}
                                                >
                                                    <ExternalLink className="mr-1 size-4" />
                                                    Mở PR
                                                </Button>
                                            </span>
                                        )}
                                    </p>
                                    {activity.createdAt && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(activity.createdAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    )
}