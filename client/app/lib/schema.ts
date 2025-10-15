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

