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
import { Link } from 'react-router'


const SignIn = () => {
  const { t, i18n } = useTranslation();
  const singInSchema = createSignInSchema(t);

  type SingInFormData = z.infer<typeof singInSchema>;

  const form = useForm<SingInFormData>({
    resolver: zodResolver(singInSchema), // use zod schema for validation
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleOnSubmit = (values: SingInFormData) => {
    console.log(values)
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
                    <div className='flex items-center justify-betweenls'>
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
              
              <Button type='submit' className='w-full pointer '>
                {t('signIn.button')}
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