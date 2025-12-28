import type { User } from "@/type"
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useCommentsQuery, useAddCommentMutation, useDeleteCommentMutation, useEditCommentMutation } from "@/hooks/use-task";
import { Loader } from "../loader";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/provider/auth-context";
import { Edit, Trash2 } from "lucide-react";

export const CommentSection = ({ taskId, members }: { taskId: string, members: { user: User | string; role: 'Admin' | 'Leader' | 'Member' }[] }) => {
    const { user } = useAuth();
    const { data: comments = [], isLoading } = useCommentsQuery(taskId);
    const { mutate: addComment, isPending } = useAddCommentMutation();
    const { mutate: deleteComment, isPending: isDeletingComment } = useDeleteCommentMutation();
    const { mutate: editComment, isPending: isEditingComment } = useEditCommentMutation();

    const [newComment, setNewComment] = useState<string>("");
    const [editingCommentId, setEditingCommentId] = useState<string | number | null>(null);
    const [editContent, setEditContent] = useState<string>("");

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        addComment({ taskId, content: newComment }, {
            onSuccess: () => {
                setNewComment("");
            }
        });
    }

    const handleStartEdit = (comment: any) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    }

    const handleSaveEdit = () => {
        if (!editContent.trim() || !editingCommentId) return;
        editComment({ commentId: editingCommentId, content: editContent, taskId }, {
            onSuccess: () => {
                setEditingCommentId(null);
                setEditContent("");
            }
        });
    }

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditContent("");
    }

    const handleDelete = (commentId: string | number) => {
        if (confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
            deleteComment({ commentId, taskId });
        }
    }
    
    return (
        <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4">Bình luận ({comments.length})</h3>

            <ScrollArea className="h-[400px] mb-4">
                {isLoading ? (
                    <Loader />
                ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">Chưa có bình luận nào</p>
                    </div>
                ) : (
                    <div className="space-y-4 pr-4">
                        {comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar className="size-8 shrink-0">
                                    <AvatarImage src={comment.user?.avatarUrl || undefined} />
                                    <AvatarFallback>
                                        {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{comment.user?.username || 'Không xác định'}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    {editingCommentId === comment.id ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="min-h-[80px]"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveEdit}
                                                    disabled={!editContent.trim() || isEditingComment}
                                                >
                                                    Lưu
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCancelEdit}
                                                    disabled={isEditingComment}
                                                >
                                                    Hủy
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                                            {user?.id === comment.user_id && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleStartEdit(comment)}
                                                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                                    >
                                                        <Edit className="size-3" />
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(comment.id)}
                                                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                                                        disabled={isDeletingComment}
                                                    >
                                                        <Trash2 className="size-3" />
                                                        Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <Separator className="my-4" />

            <div className="mt-4">
                <Textarea
                    placeholder="Thêm bình luận..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleAddComment();
                        }
                    }}
                    className="min-h-[100px]"
                />

                <div className="flex justify-end mt-2">
                    <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isPending}
                    >
                        {isPending ? "Đang đăng..." : "Đăng bình luận"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
