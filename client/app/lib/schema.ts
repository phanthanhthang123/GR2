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
  name: z.string().min(3, "Tên không gian làm việc phải có ít nhất 3 ký tự"),
  description: z.string().max(500, "Mô tả không được vượt quá 500 ký tự").optional(),
  color: z.string().regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, "Định dạng màu không hợp lệ"),
  // owner_id sẽ được thêm tự động từ user hiện tại
});

export enum ProjectStatus {
  PENDING = "Pending",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
}

export const ProjectSchema = z.object({
  name: z.string().min(3, "Tên dự án phải có ít nhất 3 ký tự"),
  description: z.string().max(1000, "Mô tả không được vượt quá 1000 ký tự").optional(),
  status : z.nativeEnum(ProjectStatus),
  startDate: z.string().min(10, "Ngày bắt đầu là bắt buộc"),
  dueDate : z.string().min(10, "Ngày kết thúc là bắt buộc"),
  members: z.array(
    z.object({
      user: z.string(),
    role: z.enum(["Admin","Leader","member"]),
    }),
  ).optional(),
  tags : z.string().optional(), 
});

export const CreateTaskSchema = z.object({
  title: z.string().min(3, "Tiêu đề task phải có ít nhất 3 ký tự"),
  description: z.string().max(1000, "Mô tả không được vượt quá 1000 ký tự").optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TO_DO),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  dueDate: z.string().min(10, "Ngày hết hạn là bắt buộc"),
  assignees: z.array(z.string()).min(1, "Cần ít nhất một người được giao"),
});