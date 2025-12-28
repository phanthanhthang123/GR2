import type { Task, User } from "@/type";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { useUpdateTaskAssigneesMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskAssignessSelector = ({
    task,
    assignees,
    projectMembers
}: {
    task: Task,
    assignees: User | User[] | string[] | null,
    projectMembers: { user: User | string; role: 'Admin' | 'Leader' | 'Member' }[] | null
}) => {
    console.log("assignees", assignees)
    console.log("projectMembers", projectMembers)
    console.log("task", task)

    const getAssigneeIds = (): string[] => {
        if (!assignees) return [];
        if (Array.isArray(assignees)) {
            return assignees.map(assignee =>
                typeof assignee === 'string' ? assignee : assignee.id
            );
        }
        return [assignees.id];
    };

    const [selectedIds, setSelectedIds] = useState<string[]>(getAssigneeIds());
    const [dropDownOpen, setDropDownOpen] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const {mutate , isPending } = useUpdateTaskAssigneesMutation();

    // Update selectedIds when assignees prop changes, but only if user hasn't interacted yet
    // This prevents resetting user's selection after save
    useEffect(() => {
        if (hasUserInteracted) return; // Don't reset if user has already made selections
        
        if (!assignees) {
            setSelectedIds([]);
            return;
        }
        if (Array.isArray(assignees)) {
            const ids = assignees.map(assignee =>
                typeof assignee === 'string' ? assignee : assignee.id
            );
            setSelectedIds(ids);
        } else {
            setSelectedIds([assignees.id]);
        }
    }, [assignees, hasUserInteracted]);

    // Get user objects from selectedIds
    const getAssigneeUsers = (): User[] => {
        if (!selectedIds.length || !projectMembers) return [];

        return projectMembers
            .filter(member => {
                const userId = typeof member.user === 'string' ? member.user : member.user.id;
                return selectedIds.includes(userId);
            })
            .map(member => typeof member.user === 'string' ? null : member.user)
            .filter((user): user is User => user !== null);
    };

    // If assignees is a single User object, use it directly
    const getDirectAssigneeUser = (): User | null => {
        if (!assignees || Array.isArray(assignees)) return null;
        return assignees;
    };
    const handleSelectAll = () => {
        if (!projectMembers) return;
        setHasUserInteracted(true); // Mark that user has interacted
        const allIds = projectMembers.map((m) =>
            typeof m.user === 'string' ? m.user : m.user.id
        );
        setSelectedIds(allIds);
    }
    const handleUnSelectAll = () => {
        setHasUserInteracted(true); // Mark that user has interacted
        setSelectedIds([])
    }
    const handleSelect = (id: string) => {
        setHasUserInteracted(true); // Mark that user has interacted
        let newSelected: string[] = [];
        if (selectedIds.includes(id)) {
            newSelected = selectedIds.filter((sid) => sid !== id)
        } else {
            newSelected = [...selectedIds, id]
        }
        setSelectedIds(newSelected);
    }
    const handleSave = () => {
        if (!task?.id) return;
        mutate({
            taskId: String(task.id),
            assignees: selectedIds
        }, {
            onSuccess: () => {
                setDropDownOpen(false);
                toast.success("Cập nhật người được giao thành công");
                // Keep selectedIds as is, don't reset from backend response
                // because backend only stores first user but we want to show all selected
            }
        });
    }
    // Always display based on selectedIds, not from assignees prop
    // This ensures we show all selected users even if backend only stores one
    const assigneeUsers = getAssigneeUsers();
    const displayUsers = assigneeUsers;

    return (
        <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Người được giao</h3>

            <div className="flex flex-wrap gap-2 mb-2">
                {displayUsers.length === 0 ? (
                    <span className="text-sx text-muted-foreground">Chưa có người được giao</span>
                ) : (
                    displayUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center bg-gray-100 rounded px-2 py-1"
                        >
                            <Avatar className="size-6 mr-1">
                                <AvatarImage src={user.avatarUrl || undefined} />
                                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{user.username}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Dropdown */}
            <div className="relative">
                <button
                    className="text-sm text-muted-foreground w-full border rounded px-3 py-2 text-left bg-white"
                    onClick={() => setDropDownOpen(!dropDownOpen)}
                >
                    {selectedIds.length === 0 ? "Chọn người được giao" : `${selectedIds.length} người đã chọn`}
                </button>

                {
                    dropDownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                            <div className="flex justify-between px-2 py-1 border-b">
                                <button
                                    className="text-xs text-blue-600"
                                    onClick={handleSelectAll}
                                >Chọn tất cả</button>

                                <button
                                    className="text-xs text-red-600"
                                    onClick={handleUnSelectAll}
                                >Bỏ chọn tất cả</button>
                            </div>
                            {
                                projectMembers?.map((m) => {
                                    const userId = typeof m.user === 'string' ? m.user : m.user.id;
                                    const user = typeof m.user === 'string' ? null : m.user;
                                    return (
                                        <label
                                            key={userId}
                                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSelect(userId);
                                            }}
                                        >
                                            <Checkbox
                                                checked={selectedIds.includes(userId)}
                                                onCheckedChange={() => handleSelect(userId)}
                                                className="mr-2"
                                            />
                                            {user && (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="size-6">
                                                        <AvatarImage src={user.avatarUrl || undefined} />
                                                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{user.username}</span>
                                                </div>
                                            )}
                                        </label>
                                    )
                                })
                            }
                            <div className="flex justify-end gap-2 px-2 py-1">
                                <Button
                                    variant={"outline"}
                                    size={"sm"}
                                    className="font-light bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    onClick={() => setDropDownOpen(false)}
                                    disabled={isPending}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    variant={"default"}
                                    size={"sm"}
                                    className="font-light"
                                    onClick={handleSave}
                                    disabled={isPending}
                                >
                                    {isPending ? "Đang lưu..." : "Lưu"}
                                </Button>

                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}