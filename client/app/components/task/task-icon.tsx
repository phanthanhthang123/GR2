import type { ActionType } from "@/type";

import {
    Building2,
    CheckCircle,
    CheckCircle2,
    CheckSquare,
    FileEdit,
    FolderEdit,
    FolderPlus,
    LogIn,
    MessageSquare,
    Upload,
    UserMinus,
    UserPlus,
    Type,
    Flag,
    FileText,
    Users,
    Eye,
    EyeOff,
    Archive,
    Calendar,
    Link as LinkIcon,
    Gauge,
} from "lucide-react";

export const getActivityMessage = (action: ActionType): string => {
    switch (action) {
        case "TITLE_UPDATED":
            return "đã cập nhật tiêu đề";
        case "STATUS_UPDATED":
            return "đã cập nhật trạng thái";
        case "DESCRIPTION_UPDATED":
            return "đã cập nhật mô tả";
        case "ASSIGNEES_UPDATED":
            return "đã cập nhật người được giao";
        case "PRIORITY_UPDATED":
            return "đã chỉnh sửa độ ưu tiên";
        case "DIFFICULTY_UPDATED":
            return "đã chỉnh sửa độ khó";
        case "DUE_DATE_UPDATED":
            return "đã sửa hạn chót";
        case "created_task":
            return "đã tạo task này";
        case "updated_task":
            return "đã cập nhật task này";
        case "completed_task":
            return "đã hoàn thành task này";
        case "created_project":
            return "đã tạo dự án này";
        case "updated_project":
            return "đã cập nhật dự án này";
        case "completed_project":
            return "đã hoàn thành dự án này";
        case "created_workspace":
            return "đã tạo không gian làm việc này";
        case "added_comment":
            return "đã thêm bình luận";
        case "added_reply":
            return "đã trả lời bình luận";
        case "edited_comment":
            return "đã sửa bình luận";
        case "added_member":
            return "đã thêm thành viên";
        case "removed_member":
            return "đã xóa thành viên";
        case "joined_workspace":
            return "đã tham gia không gian làm việc";
        case "added_attachment":
            return "đã thêm tệp đính kèm";
        case "WATCHED":
            return "đã bắt đầu theo dõi task này";
        case "UNWATCHED":
            return "đã dừng theo dõi task này";
        case "TASK_ACHIEVED":
            return "đã đánh dấu task này là hoàn thành";
        case "TASK_ARCHIVED":
            return "đã lưu trữ task này";
        case "TASK_UNARCHIVED":
            return "đã bỏ lưu trữ task này";
        case "PULL_REQUEST_UPDATED":
            return "đã cập nhật Pull Request";
        default:
            return "đã thực hiện một hành động";
    }
}

export const getActivityIcon = (action: ActionType) => {
    switch (action) {
        case "created_task":
            return (
                <div className="bg-green-600/10 p-2 rounded-md">
                    <CheckSquare className="h-5 w-5 text-green-600 rounded-full" />
                </div>
            )
        case "updated_task":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <FileEdit className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "completed_task":
            return (
                <div className="bg-green-600/10 p-2 rounded-md">
                    <CheckCircle className="h-5 w-5 text-green-600 rounded-full" />
                </div>
            )
        case "created_project":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <FolderPlus className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "updated_project":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <FolderEdit className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "completed_project":
            return (
                <div className="bg-green-600/10 p-2 rounded-md">
                    <CheckCircle2 className="h-5 w-5 text-green-600 rounded-full" />
                </div>
            )
        case "created_workspace":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <Building2 className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "added_comment":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <MessageSquare className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "added_reply":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <MessageSquare className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "edited_comment":
            return (
                <div className="bg-purple-600/10 p-2 rounded-md">
                    <FileEdit className="h-5 w-5 text-purple-600 rounded-full" />
                </div>
            )
        case "added_member":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <UserPlus className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "removed_member":
            return (
                <div className="bg-red-600/10 p-2 rounded-md">
                    <UserMinus className="h-5 w-5 text-red-600 rounded-full" />
                </div>
            )
        case "joined_workspace":
            return (
                <div className="bg-green-600/10 p-2 rounded-md">
                    <LogIn className="h-5 w-5 text-green-600 rounded-full" />
                </div>
            )
        case "added_attachment":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <Upload className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "TITLE_UPDATED":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <Type className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "STATUS_UPDATED":
            return (
                <div className="bg-purple-600/10 p-2 rounded-md">
                    <CheckCircle className="h-5 w-5 text-purple-600 rounded-full" />
                </div>
            )
        case "DESCRIPTION_UPDATED":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <FileText className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "ASSIGNEES_UPDATED":
            return (
                <div className="bg-green-600/10 p-2 rounded-md">
                    <Users className="h-5 w-5 text-green-600 rounded-full" />
                </div>
            )
        case "PRIORITY_UPDATED":
            return (
                <div className="bg-orange-600/10 p-2 rounded-md">
                    <Flag className="h-5 w-5 text-orange-600 rounded-full" />
                </div>
            )
        case "DUE_DATE_UPDATED":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <Calendar className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "WATCHED":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <Eye className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "UNWATCHED":
            return (
                <div className="bg-gray-600/10 p-2 rounded-md">
                    <EyeOff className="h-5 w-5 text-gray-600 rounded-full" />
                </div>
            )
        case "TASK_ACHIEVED":
            return (
                <div className="bg-green-600/10 p-2 rounded-md">
                    <CheckCircle className="h-5 w-5 text-green-600 rounded-full" />
                </div>
            )
        case "TASK_ARCHIVED":
            return (
                <div className="bg-gray-600/10 p-2 rounded-md">
                    <Archive className="h-5 w-5 text-gray-600 rounded-full" />
                </div>
            )
        case "TASK_UNARCHIVED":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <Archive className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "PULL_REQUEST_UPDATED":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <LinkIcon className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            )
        case "DIFFICULTY_UPDATED":
            return (
                <div className="bg-indigo-600/10 p-2 rounded-md">
                    <Gauge className="h-5 w-5 text-indigo-600 rounded-full" />
                </div>
            )
        default:
            return (
                <div className="size-6 rounded-full bg-gray-300"></div>
            );
    }
}
