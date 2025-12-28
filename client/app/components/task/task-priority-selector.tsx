import type { TaskPriority } from "@/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTaskPriorityMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskPrioritySelector = ({ priority, taskId }: { priority: TaskPriority | undefined, taskId: string }) => {

    const { mutate, isPending } = useUpdateTaskPriorityMutation();    

    const handleStatusChange = (value: string) => {
        mutate({ taskId, priority: value as TaskPriority | undefined }, {
            onSuccess: () => {
            toast.success("Cập nhật độ ưu tiên task thành công");
        },
        onError: (error: any) => {
            const errorMessage = (error as any)?.response?.data?.message || "Không thể cập nhật độ ưu tiên task";
            toast.error(errorMessage);
        }
    });
}


    return (
        <Select value={priority || ""} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]" disabled={isPending}>
                <SelectValue placeholder="Chọn độ ưu tiên" />
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="Low">Thấp</SelectItem>
                <SelectItem value="Medium">Trung bình</SelectItem>
                <SelectItem value="High">Cao</SelectItem>
            </SelectContent>
        </Select>
    )
}