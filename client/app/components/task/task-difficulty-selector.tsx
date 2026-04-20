import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTaskDifficultyMutation } from "@/hooks/use-task";
import { toast } from "sonner";

type TaskDifficulty = "Easy" | "Medium" | "Hard";

export const TaskDifficultySelector = ({ difficulty, taskId }: { difficulty: TaskDifficulty | undefined, taskId: string }) => {
    const { mutate, isPending } = useUpdateTaskDifficultyMutation();

    const handleDifficultyChange = (value: string) => {
        mutate({ taskId, difficulty: value as TaskDifficulty }, {
            onSuccess: () => {
                toast.success("Cập nhật độ khó task thành công");
            },
            onError: (error: any) => {
                const errorMessage = (error as any)?.response?.data?.message || "Không thể cập nhật độ khó task";
                toast.error(errorMessage);
            }
        });
    };

    return (
        <Select value={difficulty || "Medium"} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="w-[180px]" disabled={isPending}>
                <SelectValue placeholder="Chọn độ khó" />
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="Easy">Dễ</SelectItem>
                <SelectItem value="Medium">Trung bình</SelectItem>
                <SelectItem value="Hard">Khó</SelectItem>
            </SelectContent>
        </Select>
    );
};

