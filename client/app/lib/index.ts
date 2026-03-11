import type { Task, TaskStatus } from "@/type";
import { ProjectStatus } from "./schema";

export const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/"
];

export const getTaskStatusColor = (status: string) => {
  switch (status) {
    case ProjectStatus.PENDING:
      return "bg-blue-500 text-white border border-blue-500";
    case ProjectStatus.IN_PROGRESS:
      return "bg-orange-500 text-white border border-orange-500";
    case ProjectStatus.COMPLETED:
      return "bg-green-500 text-white border border-green-500"; 
    default:
      return "bg-gray-500 text-white border border-gray-500";
  }
};

// Helper function to translate project status to Vietnamese
export const getProjectStatusLabel = (status: string): string => {
  switch (status) {
    case "Pending":
      return "Đang chờ";
    case "In Progress":
      return "Đang tiến hành";
    case "Completed":
      return "Hoàn thành";
    case "Active":
      return "Đang hoạt động";
    case "Archived":
      return "Đã lưu trữ";
    case "Deleted":
      return "Đã xóa";
    default:
      return status;
  }
};

export const getProjectProgress = (tasks: {status : TaskStatus | string}[]) => {
  if (!tasks || tasks.length === 0) {
    return 0;
  }

  const totalTasks = tasks.length;
  
  // Filter completed tasks - check for 'Done' status (case-insensitive and trimmed)
  const completedTasks = tasks.filter(task => {
    const status = typeof task?.status === 'string' ? task.status.trim() : task?.status;
    return status === 'Done' || status === 'done' || status === 'DONE';
  }).length;
  
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return progress;
};