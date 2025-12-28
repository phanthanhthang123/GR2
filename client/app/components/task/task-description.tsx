import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";
import { useUpdateDescriptionMutation } from "@/hooks/use-task";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";

export const TaskDescription = ({ description, taskId }: { description: string, taskId: string }) => {

    const [isEditing, setIsEditing] = useState(false);
    const [newDescription, setNewDescription] = useState(description);

    // Sync state with prop when title changes
    useEffect(() => {
        setNewDescription(description);
    }, [description]);

    const { mutate, isPending } = useUpdateDescriptionMutation();

    const updateDescription = () => {
        mutate({ taskId, description: newDescription }, {
            onSuccess: (response: any) => {
                setIsEditing(false);
                if (response?.response?.description) {
                    setNewDescription(response.response.description);
                }
                toast.success("Cập nhật mô tả task thành công");
            },
            onError: (error: any) => {
                const errorMessage = (error as any)?.response?.data?.msg || "Không thể cập nhật mô tả task";
                toast.error(errorMessage);
            }
        });
    }

    return (
        <div className="flex flex-col gap-2">
            {
                isEditing ? (
                    <Textarea
                        className="w-full"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        disabled={isPending}
                        rows={4}
                    />
                ) : (
                    <div className="text-sm md:text-base text-muted-foreground whitespace-pre-line">
                        {description}
                    </div>
                )
            }

            <div className="flex items-center gap-2">
                {
                    isEditing ? (
                        <Button
                            className="py-0"
                            size="sm"
                            onClick={updateDescription}
                            disabled={isPending}
                        >
                            Lưu
                        </Button>
                    ) : (
                        <Edit className="size-4 cursor-pointer" onClick={() => setIsEditing(true)} />
                    )
                }
            </div>
        </div>
    )
}