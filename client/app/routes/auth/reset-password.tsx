import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { useForm, } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { createResetPasswordSchema } from '@/lib/schema'
import {z} from 'zod'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useResetPasswordMutation } from '@/hooks/use-auth';
import { toast } from 'sonner';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const resetPasswordSchema = createResetPasswordSchema(t);
  const [isSuccess, setIsSuccess] = useState(false);

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    }
  })
  const { mutate: resetPassword, isPending } = useResetPasswordMutation();
  
  const onSubmit = async (values: ResetPasswordFormData) => {
    console.log(values)
    console.log(token)
    if(!token){
      toast.error(t("resetPassword.invalidTokenToast"));
      return;
    }
    resetPassword({
      token,
      newPassword: values.newPassword
    },{
      onSuccess(data) {
        setIsSuccess(true);
        toast.success(t("resetPassword.successToast"));
      },
      onError(error) {
        const errorMessage = (error as any)?.response?.data?.msg || error?.message || t("resetPassword.errorMessage");
        toast.error(errorMessage);
      }
    })
  }
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <div className='w-full max-w-md space-y-6'>

        <div className='flex flex-col items-center justify-center space-y-2'>
          <h1 className='text-2xl font-bold'>{t("resetPassword.title")}</h1>
          <p className='text-muted-foreground'>{t("resetPassword.description")}</p>
        </div>


        <Card>
          <CardHeader>
            <Link to="/sign-in" className='flex items-center gap-2 text-sm text-primary hover:underline mb-4'>
              <ArrowLeft className='w-4 h-4'/>
              <span>{t("resetPassword.backToLogin")}</span>
            </Link>
          </CardHeader>
          <CardContent>
            {
              isSuccess ? (
                <div className='flex flex-col items-center justify-center'>
                  <CheckCircle className='w-10 h-10 text-green-500'/>
                  <h2 className='text-lg font-semibold mb-4'>{t("forgotPassword.successTitle")}</h2>
                  <p className='text-muted-foreground'>{t("forgotPassword.successDescription")}</p>
                </div>
              ):(
                <>
                { !token ? (
                  <div className='space-y-4'>
                    <h2 className='text-lg font-semibold'>{t("resetPassword.invalidTokenTitle")}</h2>
                    <p className='text-muted-foreground'>{t("resetPassword.invalidTokenDescription")}</p>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                      <FormField
                        name='newPassword'
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("resetPassword.newPassword")}</FormLabel>
                            <FormControl>
                              <Input {...field} type='password' placeholder={t("resetPassword.placeholderNewPassword") || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name='confirmNewPassword'
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("resetPassword.confirmNewPassword")}</FormLabel>
                            <FormControl>
                              <Input {...field} type='password' placeholder={t("resetPassword.placeholderConfirmNewPassword") || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type='submit' className='w-full' disabled={isPending || !token}>
                        {
                          isPending ? (
                            <Loader2 className='w-4 h-4 animate-spin'/>
                          ) : t("resetPassword.button")
                        }
                      </Button>
                    </form>
                  </Form>
                ) }
                </>
              )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword