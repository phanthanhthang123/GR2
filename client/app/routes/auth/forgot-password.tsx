import React,{useState} from 'react'
import {z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createForgotPasswordSchema } from '@/lib/schema'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { useForgotPasswordMutation } from '@/hooks/use-auth'
import { toast } from 'sonner'

const ForgotPassword = () => {
  const { t } = useTranslation();
  const forgotPasswordSchema = createForgotPasswordSchema(t);
  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

  const [isSuccess, setIsSuccess] = useState(false);
  const {mutate: forgotPassword, isPending} = useForgotPasswordMutation();
  
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema), // use zod schema for validation
    defaultValues: {
      email: '',
    }
  })

  const onSubmit = async (values: ForgotPasswordFormData) => {
    forgotPassword(values, {
      onSuccess: (res) => {
        // console.log(res);
        if((res as any)?.err === 1){
          toast.error(t("forgotPassword.EmailNotFound"));
          return;
        }
        setIsSuccess(true);
        toast.success(t("forgotPassword.successToast"));
      },
      onError: (error) => {
        const errorMessage = error?.message || t("forgotPassword.errorMessage");
        toast.error(errorMessage);
        // console.error('Forgot password failed', error);
      }
    });
  }

  return (
    <div className="w-full">
      <Card className="w-full max-w-md mx-auto bg-slate-900/80 border-slate-800 text-slate-50 shadow-xl">
        <CardHeader>
          <Link
            to="/sign-in"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("forgotPassword.backToLogin")}</span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">
              {t("forgotPassword.title")}
            </h1>
            <p className="text-xs text-slate-300">
              {t("forgotPassword.description")}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <h2 className="text-lg font-semibold">
                {t("forgotPassword.successTitle")}
              </h2>
              <p className="text-sm text-slate-300">
                {t("forgotPassword.successDescription")}
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forgotPassword.email")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                          placeholder={
                            t("forgotPassword.placeholderEmail") || ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-slate-50"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("forgotPassword.button")
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPassword