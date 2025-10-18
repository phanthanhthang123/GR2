import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { createSignUpSchema } from "@/lib/schema";
import { postData } from "@/lib/fetch-utlis";


export const useSignUpMutation = () => {
  const { t } = useTranslation();
  const singUpSchema = createSignUpSchema(t);
  type SingUpFormData = z.infer<typeof singUpSchema>;

  return useMutation({
    mutationFn: async (data: SingUpFormData) => {
      // Transform data to match server expectations
      const { confirmPassword, ...serverData } = data;
      const transformedData = {
        username: data.name, // Map name to username
        email: data.email,
        password: data.password
      };
      // console.log(transformedData)
      return postData("/auth/register", transformedData);
    },
  });
};
