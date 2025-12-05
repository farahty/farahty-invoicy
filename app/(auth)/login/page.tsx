"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, FileText, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");
  const tOrg = useTranslations("organizations");

  // Get invitation params from URL
  const invitationId = searchParams.get("invitationId");
  const invitationEmail = searchParams.get("email");
  const isInvitationFlow = !!invitationId && !!invitationEmail;

  const loginSchema = z.object({
    email: z.string().email(t("emailRequired")),
    password: z.string().min(6, t("passwordMinLength")),
  });

  type LoginForm = z.infer<typeof loginSchema>;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: invitationEmail || "",
      password: "",
    },
  });

  // Update email when invitation email changes
  useEffect(() => {
    if (invitationEmail) {
      form.setValue("email", invitationEmail);
    }
  }, [invitationEmail, form]);

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(result.error.message || t("invalidCredentials"));
        return;
      }

      toast.success(t("loginSuccess"));

      // If invitation flow, redirect back to accept invitation page
      if (invitationId) {
        router.push(`/accept-invitation/${invitationId}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      toast.error(t("invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-2">
            {isInvitationFlow ? (
              <Building2 className="w-6 h-6 text-primary-foreground" />
            ) : (
              <FileText className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">{t("login")}</CardTitle>
          {isInvitationFlow && (
            <CardDescription>{tOrg("loginToAcceptInvitation")}</CardDescription>
          )}
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={isInvitationFlow}
                        className={isInvitationFlow ? "bg-muted" : ""}
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
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("password")}</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {t("forgotPassword")}
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("login")}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t("noAccount")}{" "}
                <Link
                  href={
                    isInvitationFlow
                      ? `/register?invitationId=${invitationId}&email=${encodeURIComponent(
                          invitationEmail || ""
                        )}`
                      : "/register"
                  }
                  className="font-medium text-foreground hover:underline"
                >
                  {t("register")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
