import { z } from "zod";
import { TaskStatus } from "../type";

// export const singInSchema = z.object({
//   email: z.string().email(t("signIn.emailError")),
//   password: z.string().min(8, t("signIn.passwordError")),
// });

export const createSignInSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("signIn.emailError")),
    password: z.string().min(8, t("signIn.passwordError")),
  });

export const createSignUpSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("signUp.emailError")),
    password: z.string().min(8, t("signUp.passwordError")),
    name: z.string().min(3, t("signUp.fullNameError")),
    confirmPassword: z.string().min(8, t("signUp.passwordsDontMatch")),
  })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("signUp.passwordsDontMatch"),
    });

export const createResetPasswordSchema = (t: (key: string) => string) =>
  z.object({
    newPassword: z.string().min(8, t("resetPassword.passwordError")),
    confirmNewPassword: z.string().min(8, t("resetPassword.passwordsDontMatch")),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: t("resetPassword.passwordsDontMatch"),
  });

export const createForgotPasswordSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("forgotPassword.emailError")),
  });

export const CreateWorkspaceSchema = (t : (key: string) => string) =>
z.object({
  name: z.string().min(3, "Workspace name must be at least 3 characters long"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  color: z.string().regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, "Invalid color format"),
  // owner_id sẽ được thêm tự động từ user hiện tại
});

export enum ProjectStatus {
  PENDING = "Pending",
  IN_PROGRESS = "IN Progress",
  COMPLETED = "Completed",
}

export const ProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters long"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  status : z.nativeEnum(ProjectStatus),
  startDate: z.string().min(10, "Start date is required"),
  dueDate : z.string().min(10, "Due date is required"),
  members: z.array(
    z.object({
      user: z.string(),
    role: z.enum(["Admin","Leader","member"]),
    }),
  ).optional(),
  tags : z.string().optional(), 
});

export const CreateTaskSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters long"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TO_DO),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  dueDate: z.string().min(10, "Due date is required"),
  assignees: z.array(z.string()).min(1, "At least one assignee is required"),
});