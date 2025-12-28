import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";
import { useUpdateTaskTitleMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskTitle = ({ title, taskId }: { title: string, taskId: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newTitle, setNewTitle] = useState(title);

    // Sync state with prop when title changes
    useEffect(() => {
        setNewTitle(title);
    }, [title]);

    const { mutate, isPending } = useUpdateTaskTitleMutation();

    const updateTitle = () => {
        mutate({ taskId, title: newTitle }, {
            onSuccess: (response: any) => {
                setIsEditing(false);
                if (response?.response?.title) {
                    setNewTitle(response.response.title);
                }
                toast.success("Cập nhật tiêu đề task thành công");
            },
            onError: (error: any) => {
                const errorMessage = (error as any)?.response?.data?.msg || "Không thể cập nhật tiêu đề task";
                toast.error(errorMessage);
            }
        });
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <Input
                        className="text-xl font-semibold"
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        disabled={isPending}
                    />
                ) : (
                    <h2 className="text-2xl font-bold leading-tight text-foreground">{title}</h2>
                )}
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center rounded-md border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                    >
                        <Edit className="mr-1 size-3" />
                        Sửa
                    </button>
                )}
            </div>
            {isEditing && (
                <div className="flex items-center gap-2">
                    <Button
                        className="py-0 px-3"
                        size="sm"
                        onClick={updateTitle}
                        disabled={isPending}
                    >
                        Lưu
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setIsEditing(false);
                            setNewTitle(title);
                        }}
                        disabled={isPending}
                    >
                        Hủy
                    </Button>
                </div>
            )}
        </div>
    );
}