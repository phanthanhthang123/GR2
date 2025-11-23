import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSignUpSchema } from '@/lib/schema'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import { useNavigate } from "react-router";
import { useSignUpMutation } from '@/hooks/use-auth'
import { toast } from 'sonner'

const SignUp = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const singUpSchema = createSignUpSchema(t);

  type SingUpFormData = z.infer<typeof singUpSchema>;

  const form = useForm<SingUpFormData>({
    resolver: zodResolver(singUpSchema), // use zod schema for validation
    defaultValues: {
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    }
  })

  const {mutate,isPending} = useSignUpMutation();

  const handleOnSubmit = async (values: SingUpFormData) => {
    try {
      // console.log('Submitting form with values:', values);
      mutate(values, {
        onSuccess: () => {
          toast.success(t("signUp.successMessage"));
          navigate('/sign-in');
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || t("signUp.serverError");
          toast.error(errorMessage);
        }
      });
    } catch (error) {
      form.setError('root.serverError', { message: (error as Error)?.message })
    }
  }

  return (
    <div
    className='min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4'
    >
      <Card className='max-w-3/12 w-full'> 
        <CardHeader className='text-center mb-5'> 
          <CardTitle className='text-2xl font-bold'>{t('signUp.title')}</CardTitle>
          <CardDescription className='text-sm text-muted-foreground '>{t('signUp.description')}</CardDescription>
        </CardHeader>
        <CardContent>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleOnSubmit)}
              className='space-y-6'
            >
              <FormField
                control={form.control}
                name='email'
                render= {({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signUp.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder={t('signUp.placeholderEmail')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='name'
                render= {({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signUp.fullName')}</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder={t('signUp.placeholderFullName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render= {({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signUp.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={t('signUp.placeholderPassword')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render= {({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signUp.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={t('signUp.placeholderConfirmPassword')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type='submit' className='w-full pointer' disabled={isPending}>
                {isPending ?  t('signUp.buttonLoading') : t('signUp.button')}
              </Button>
            </form>
          </Form>

        </CardContent>

        <CardFooter className='flex items-center justify-center text-center mt6'>
          <div> 
            <p>{t('signUp.textSignIn')} <Link className='text-blue-600' to="/sign-in">{t('signUp.textSignInLink')}</Link></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SignUp