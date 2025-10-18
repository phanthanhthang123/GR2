import React,{useState} from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createForgotPasswordSchema } from '@/lib/schema'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

const ForgotPassword = () => {
  const { t } = useTranslation();
  const forgotPasswordSchema = createForgotPasswordSchema(t);
  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
  
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema), // use zod schema for validation
    defaultValues: {
      email: '',
    }
  })

  const onSubmit = async (values: ForgotPasswordFormData) => {
    
  }

  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <div className='w-full max-w-md space-y-6'>

        <div className='flex flex-col items-center justify-center space-y-2'>
          <h1 className='text-2xl font-bold'>{t("forgotPassword.title")}</h1>
          <p className='text-muted-foreground'>{t("forgotPassword.description")}</p>
        </div>


        <Card>
          <CardHeader>
            <Link to="/sign-in">
              <ArrowLeft className='w-4 h-4'/>
              <span>{t("forgotPassword.backToLogin")}</span>
            </Link>
          </CardHeader>
          <CardContent>
            {
              isSuccess ? (
                <div className='text-center'>
                  <h2 className='text-lg font-semibold mb-4'>{t("forgotPassword.successTitle")}</h2>
                  <p className='text-muted-foreground'>{t("forgotPassword.successDescription")}</p>
                </div>
              ):(
                <>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                    <FormField
                    name='email'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("forgotPassword.email")}</FormLabel>
                        <FormControl>
                          <Input {...field} type='email' placeholder={t("forgotPassword.placeholderEmail") || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                    />

                    <Button type='submit' className='w-full'>
                      {t("forgotPassword.button")}
                    </Button>
                  </form>
                </Form>
                </>
              )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPassword