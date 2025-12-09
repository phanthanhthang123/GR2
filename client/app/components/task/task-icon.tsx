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
} from "lucide-react";

export const getActivityMessage = (action: ActionType): string => {
    switch (action) {
        case "TITLE_UPDATED":
            return "updated the title";
        case "STATUS_UPDATED":
            return "updated the status";
        case "DESCRIPTION_UPDATED":
            return "updated the description";
        case "ASSIGNEES_UPDATED":
            return "updated the assignees";
        case "PRIORITY_UPDATED":
            return "updated the priority";
        case "created_task":
            return "created this task";
        case "updated_task":
            return "updated this task";
        case "completed_task":
            return "completed this task";
        case "created_project":
            return "created this project";
        case "updated_project":
            return "updated this project";
        case "completed_project":
            return "completed this project";
        case "created_workspace":
            return "created this workspace";
        case "added_comment":
            return "added a comment";
        case "added_member":
            return "added a member";
        case "removed_member":
            return "removed a member";
        case "joined_workspace":
            return "joined the workspace";
        case "added_attachment":
            return "added an attachment";
        case "WATCHED":
            return "started watching this task";
        case "UNWATCHED":
            return "stopped watching this task";
        case "TASK_ACHIEVED":
            return "marked this task as achieved";
        case "TASK_ARCHIVED":
            return "archived this task";
        case "TASK_UNARCHIVED":
            return "unarchived this task";
        default:
            return "performed an action";
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
        default:
            return (
                <div className="size-6 rounded-full bg-gray-300"></div>
            );
    }
}
