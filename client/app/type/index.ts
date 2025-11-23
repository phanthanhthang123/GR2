export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: "Admin" | "Leader" | "Member";
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  avatarUrl?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  onwner: User | string;
  color: string;
  status: 'Active' | 'Archived' | 'Deleted';
  createdAt: string | null;  
  updatedAt: string | null;
  members?: any[];
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  Workspace: Workspace | string;
  startDate: Date | null;
  dueDate: Date | null;
  progress: number;
  tasks?: Task[];
  members?: {
    user: User | string;
    role: 'Admin' | 'Leader' | 'Member';
  }[];
  status: 'Active' | 'Archived' | 'Deleted';
  createdAt: Date | null;  
  updatedAt: Date | null;
  isArchived?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  project: Project | string;
  createdAt: Date | null;  
  updatedAt: Date | null;
  isArchived?: boolean;
  dueDate: Date | null;
  priority: 'Low' | 'Medium' | 'High';
  assigned_to?: User[] | string | null;
  createdBy: User | string;
  assigners?: User[] | string[] | null;
  subtasks?: Subtask[];
  watchers?: User[] | string[] | null;
  attachments?: Attachment[];
}

export enum TaskStatus {
  TO_DO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export interface Attachment {
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadBy: User |  string;
  uploadedAt: Date | null;
  id : string;
}

export enum ProjectMemberRole {
  ADMIN = 'Admin',
  LEADER = 'Leader',
  MEMBER = 'Member',
}