import type { TaskPriority } from "@/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTaskPriorityMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskPrioritySelector = ({ priority, taskId }: { priority: TaskPriority | undefined, taskId: string }) => {

    const { mutate, isPending } = useUpdateTaskPriorityMutation();    

    const handleStatusChange = (value: string) => {
        mutate({ taskId, priority: value as TaskPriority | undefined }, {
            onSuccess: () => {
            toast.success("Task priority updated successfully");
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.message || "Failed to update task priority";
            toast.error(errorMessage);
        }
    });
}


    return (
        <Select value={priority || ""} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]" disabled={isPending}>
                <SelectValue placeholder="Select Priority" />
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
            </SelectContent>
        </Select>
    )
}