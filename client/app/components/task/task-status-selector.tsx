import type { TaskStatus } from "@/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskStatusSelector = ({ status, taskId }: { status: TaskStatus, taskId: string }) => {

    const { mutate, isPending } = useUpdateTaskStatusMutation();    

    const handleStatusChange = (value: string) => {
        mutate({ taskId, status: value as TaskStatus }, {
            onSuccess: () => {
                toast.success("Task status updated successfully");
            },
            onError: (error: any) => {
                const errorMessage = (error as any)?.response?.data?.message || "Failed to update task status";
                toast.error(errorMessage);
            }
        });
    }


    return (
        <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]" disabled={isPending}>
                <SelectValue placeholder="Select Status" />
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
        </Select>
    )
}