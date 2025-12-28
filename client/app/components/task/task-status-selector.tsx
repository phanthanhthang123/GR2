import type { TaskStatus } from "@/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskStatusSelector = ({ status, taskId }: { status: TaskStatus, taskId: string }) => {

    const { mutate, isPending } = useUpdateTaskStatusMutation();    

    const handleStatusChange = (value: string) => {
        mutate({ taskId, status: value as TaskStatus }, {
            onSuccess: () => {
                toast.success("Cập nhật trạng thái task thành công");
            },
            onError: (error: any) => {
                const errorMessage = (error as any)?.response?.data?.message || "Không thể cập nhật trạng thái task";
                toast.error(errorMessage);
            }
        });
    }


    return (
        <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]" disabled={isPending}>
                <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="To Do">Chưa làm</SelectItem>
                <SelectItem value="In Progress">Đang làm</SelectItem>
                <SelectItem value="Done">Hoàn thành</SelectItem>
            </SelectContent>
        </Select>
    )
}