import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { createSignUpSchema } from "@/lib/schema";
import { postData, updateData, postFormData, deleteData } from "@/lib/fetch-utlis";


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

export const useSignInMutation = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return postData("/auth/login", data);
    },
  });
}

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      return postData("/auth/forgot-password", data);
    },
  });
}

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: { token: string | null; newPassword: string }) => {
      return postData("/auth/reset-password", data);
    },
  });
}

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: { id?: string; password: string; newPassword: string }) => {
      return postData("/auth/edit-password", data);
    },
  });
};

export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: async (data: { id?: string; username: string }) => {
      return updateData("/auth/profile", data);
    },
  });
};

export const useUploadAvatarMutation = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      return postFormData("/auth/profile/avatar", form);
    },
  });
};

export const useDeleteAvatarMutation = () => {
  return useMutation({
    mutationFn: async () => deleteData("/auth/profile/avatar"),
  });
};