import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useLocation, Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const schema = z.object({
    email: z.string().email(t("emailLabel")),
    password: z.string().min(1, t("passwordLabel")),
  });
  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const login = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        if (data.user.role === "admin") {
          setLocation("/admin/dashboard");
        } else {
          setLocation("/marketplace");
        }
      },
      onError: () => {
        setError(t("loginError"));
      },
    },
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    login.mutate({ data });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3 shadow-lg">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("appName")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("loginTagline")}</p>
        </div>

        <Card className="shadow-xl border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
            <CardDescription>{t("loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/60 border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("demoAccounts")}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="text-left rounded-md bg-background border border-border px-2.5 py-2 hover:border-primary transition-colors"
                  onClick={() => { form.setValue("email", "admin@example.com"); form.setValue("password", "password123"); }}
                  data-testid="button-demo-admin"
                >
                  <Badge variant="outline" className="text-xs mb-1">Admin</Badge>
                  <p className="text-xs text-muted-foreground">admin@example.com</p>
                </button>
                <button
                  type="button"
                  className="text-left rounded-md bg-background border border-border px-2.5 py-2 hover:border-primary transition-colors"
                  onClick={() => { form.setValue("email", "buyer@example.com"); form.setValue("password", "password123"); }}
                  data-testid="button-demo-buyer"
                >
                  <Badge variant="secondary" className="text-xs mb-1">Buyer</Badge>
                  <p className="text-xs text-muted-foreground">buyer@example.com</p>
                </button>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("emailLabel")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder={t("emailPlaceholder")} data-testid="input-email" className="bg-background" />
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
                      <FormLabel>{t("passwordLabel")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={t("passwordPlaceholder")}
                            data-testid="input-password"
                            className="bg-background pe-10"
                          />
                          <button
                            type="button"
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md" data-testid="text-login-error">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={login.isPending} data-testid="button-submit">
                  {login.isPending ? t("signingIn") : t("signIn")}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/register" className="text-primary font-medium hover:underline" data-testid="link-register">
                {t("createOne")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
