import { z } from "zod";

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
