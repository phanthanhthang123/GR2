import { useQuery } from "@tanstack/react-query"
import { fetchData } from "@/lib/fetch-utlis"
import { Loader } from "../loader";
import type { ActivityLog } from "@/type";
import { getActivityIcon, getActivityMessage } from "./task-icon";
import { ScrollArea } from "../ui/scroll-area";

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
                <h3 className="text-lg text-muted-foreground mb-4">Activity</h3>
                <Loader />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg text-muted-foreground mb-4">Activity</h3>
                <p className="text-sm text-muted-foreground">Failed to load activities</p>
            </div>
        )
    }

    const activities = data?.response || [];

    return (
        <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-lg text-muted-foreground mb-4">Activity</h3>

            {activities.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No activity yet</p>
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
                                        <span className="font-medium">{activity.user?.username || 'Unknown'}</span> {" "}
                                        {getActivityMessage(activity.action)}
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