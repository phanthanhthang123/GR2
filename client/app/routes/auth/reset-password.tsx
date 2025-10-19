import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { useForm, } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { createResetPasswordSchema } from '@/lib/schema'
import {z} from 'zod'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const resetPasswordSchema = createResetPasswordSchema(t);
  const [isSuccess, setIsSuccess] = useState(false);

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: ''
    }
  })

  const onSubmit = async (values: ResetPasswordFormData) => {
    try {
      // const response = await resetPasswordService(token, values.newPassword);
    } catch (error) {
      // console.error('Reset password failed', error)
    }
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
            <Link to="/sign-in">
              <ArrowLeft className='w-4 h-4'/>
              <span>{t("resetPassword.backToLogin")}</span>
            </Link>
          </CardHeader>
          <CardContent>
            {
              isSuccess ? (
                <div className='flex flex-col items-center justify-center'>
                  <CheckCircle className='w-10 h-10 text-green-500'/>
                  <h1 className='text-2xl font-bold'>{t("forgotPassword.successTitle")}</h1>
                  <p className='text-center'>{t("forgotPassword.successDescription")}</p>
                </div>
              ):(
                <div>
                  
                </div>
              )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword