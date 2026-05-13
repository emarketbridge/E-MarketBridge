import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "buyer"]),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "buyer" },
  });

  const register = useRegister({
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
        setError("Registration failed. This email may already be in use.");
      },
    },
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    register.mutate({ data });
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
          <h1 className="text-2xl font-bold text-foreground">Join e-MarketBridge</h1>
          <p className="text-muted-foreground text-sm mt-1">Start selling or shopping today</p>
        </div>

        <Card className="shadow-xl border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ahmad Al-Mansouri" data-testid="input-name" className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="you@example.com" data-testid="input-email" className="bg-background" />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Min. 6 characters" data-testid="input-password" className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am a...</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role" className="bg-background">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="buyer">Buyer — I want to shop</SelectItem>
                          <SelectItem value="admin">Seller — I want to open a store</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md" data-testid="text-register-error">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={register.isPending} data-testid="button-submit">
                  {register.isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
