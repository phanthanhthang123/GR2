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
      confirmPassword: '',
      cpa: 3,
      interviewScore: 6,
      cvScore: 6,
      yearsExperience: 0,
      numProjects: 0,
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
          const errorMessage =
            error?.response?.data?.msg ||
            error?.response?.data?.message ||
            t("signUp.serverError");
          toast.error(errorMessage);
        }
      });
    } catch (error) {
      form.setError('root.serverError', { message: (error as Error)?.message })
    }
  }

  return (
    <div className="w-full">
      <Card className="w-full max-w-md mx-auto bg-slate-900/80 border-slate-800 text-slate-50 shadow-xl">
        <CardHeader className="text-center mb-2">
          <CardTitle className="text-2xl font-semibold">
            {t("signUp.title")}
          </CardTitle>
          <CardDescription className="text-sm text-slate-300">
            {t("signUp.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleOnSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.placeholderEmail")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.fullName")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.placeholderFullName")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.placeholderPassword")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.placeholderConfirmPassword")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs font-medium text-slate-400 pt-1">
                {t("signUp.kpiSectionTitle")}
              </p>
              <FormField
                control={form.control}
                name="cpa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.cpa")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={4}
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.cpaHint")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interviewScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.interviewScore")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={10}
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.interviewHint")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cvScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.cvScore")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={10}
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.cvHint")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.yearsExperience")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min={0}
                        max={50}
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.yearsHint")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numProjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signUp.numProjects")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={1}
                        min={0}
                        max={200}
                        className="bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500"
                        placeholder={t("signUp.numProjectsHint")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full pointer bg-blue-600 hover:bg-blue-500 text-slate-50"
                disabled={isPending}
              >
                {isPending ? t("signUp.buttonLoading") : t("signUp.button")}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex items-center justify-center text-center mt-2">
          <div>
            <p className="text-xs text-slate-300">
              {t("signUp.textSignIn")}{" "}
              <Link className="text-blue-300 hover:text-blue-200" to="/sign-in">
                {t("signUp.textSignInLink")}
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SignUp