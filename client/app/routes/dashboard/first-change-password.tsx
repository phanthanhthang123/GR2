import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { postData } from "@/lib/fetch-utlis";
import { toast } from "sonner";
import { useAuth } from "@/provider/auth-context";
import { useNavigate } from "react-router";

const schema = z
  .object({
    newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmNewPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  })
  .refine((val) => val.newPassword === val.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type FormValues = z.infer<typeof schema>;

const FirstChangePassword: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  React.useEffect(() => {
    if (!user?.id) return;
    if (user.mustChangePassword === false) {
      navigate("/dashboard");
    }
  }, [user?.id, user?.mustChangePassword, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
      toast.error("Không tìm thấy thông tin người dùng.");
      return;
    }
    try {
      const res = await postData<{ err: number; msg: string }>(
        "/auth/first-change-password",
        { id: user.id, newPassword: values.newPassword }
      );
      if (res.err === 0) {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, mustChangePassword: false })
        );
        toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
        // Đăng xuất để user login lại bằng mật khẩu mới
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/sign-in");
      } else {
        toast.error(res.msg || "Không thể đổi mật khẩu.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.msg || "Không thể đổi mật khẩu.");
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full max-w-md mx-auto bg-white border-slate-200 text-slate-900 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            Đổi mật khẩu lần đầu
          </CardTitle>
          <CardDescription className="text-slate-600">
            Vì lý do bảo mật, bạn cần đặt mật khẩu mới trước khi sử dụng hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                        placeholder="Nhập mật khẩu mới"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                        placeholder="Nhập lại mật khẩu mới"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-slate-50"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Đang lưu..." : "Lưu mật khẩu mới"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirstChangePassword;


