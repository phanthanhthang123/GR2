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
  leader_id: string;
  name: string;
  description?: string;
  start_date: string;  // ISO date string
  end_date: string;    // ISO date string
  color: string;
  status: string;
  created_by: string;
  createdAt: string;   // string vì API trả về ISO date
  updatedAt: string | null;
}
