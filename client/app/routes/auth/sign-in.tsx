import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSignInSchema } from '@/lib/schema'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router'
import { useSignInMutation } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Loader2, type Loader } from 'lucide-react'
import { useAuth } from '@/provider/auth-context'


const SignIn = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const singInSchema = createSignInSchema(t);
  const {login} = useAuth();

  type SingInFormData = z.infer<typeof singInSchema>;

  const form = useForm<SingInFormData>({
    resolver: zodResolver(singInSchema), // use zod schema for validation
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const {mutate,isPending} = useSignInMutation();

  const handleOnSubmit = async (values: SingInFormData) => {
    try {
      mutate(values, {
        onSuccess: (data) => {
          login(data)
          navigate('/dashboard');
          toast.success(t("signIn.successMessage"));
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || t("signIn.serverError");
          toast.error(errorMessage);
          // console.log(error)
        }
      });
    } catch (error) {
      console.error('Login failed', error)
    }
  }

  return (
    <div
    className='min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4'
    >
      <Card className='max-w-3/12 w-full'> 
        <CardHeader className='text-center mb-5'> 
          <CardTitle className='text-2xl font-bold'>{t('signIn.title')}</CardTitle>
          <CardDescription className='text-sm text-muted-foreground '>{t('signIn.description')}</CardDescription>
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
                    <FormLabel>{t('signIn.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder={t('signIn.placeholderEmail')} {...field} />
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
                    <div className='flex items-center justify-between'>
                      <FormLabel>{t('signIn.password')}</FormLabel>
                      <Link to="/forgot-password" className='text-sm text-blue-600 float-right'>{t('signIn.forgotPassword')}
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={t('signIn.placeholderPassword')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type='submit' className='w-full pointer' disabled={isPending}>
                {isPending ? <Loader2 className='w-4 h-4 mr-2'/>: t('signIn.button')}
              </Button>
            </form>
          </Form>

        </CardContent>

        <CardFooter className='flex items-center justify-center text-center mt6'>
          <div> 
            <p>{t('signIn.textSignUp')} <Link className='text-blue-600' to="/sign-up">{t('signIn.textSignUpLink')}</Link></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SignIn