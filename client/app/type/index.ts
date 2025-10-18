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
}
