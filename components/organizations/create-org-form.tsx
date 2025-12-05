"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Building2 } from "lucide-react";
import { organization } from "@/lib/auth-client";

const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

interface CreateOrgFormProps {
  onSuccess?: () => void;
  isOnboarding?: boolean;
}

export function CreateOrgForm({
  onSuccess,
  isOnboarding = false,
}: CreateOrgFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");

  const form = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    const slug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50);
    form.setValue("slug", slug);
  };

  async function onSubmit(data: CreateOrgForm) {
    setIsLoading(true);
    try {
      const result = await organization.create({
        name: data.name,
        slug: data.slug,
      });

      if (result.error) {
        toast.error(result.error.message || t("createError"));
        return;
      }

      toast.success(t("createSuccess"));

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error(t("createError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className={isOnboarding ? "w-full max-w-md" : ""}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          {isOnboarding ? t("createFirstOrg") : t("createOrganization")}
        </CardTitle>
        <CardDescription>
          {isOnboarding
            ? t("createFirstOrgDescription")
            : t("createOrgDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("organizationName")}</Label>
            <Input
              id="name"
              placeholder={t("organizationNamePlaceholder")}
              {...form.register("name")}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t("slug")}</Label>
            <Input
              id="slug"
              placeholder={t("slugPlaceholder")}
              {...form.register("slug")}
              disabled={isLoading}
            />
            {form.formState.errors.slug && (
              <p className="text-sm text-destructive">
                {form.formState.errors.slug.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t("slugHelp")}</p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isLoading ? tCommon("loading") : t("createOrganization")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
