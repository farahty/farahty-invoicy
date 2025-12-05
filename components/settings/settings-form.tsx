"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useState } from "react";
import { updateSettings, type UserSettings } from "@/actions/settings";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional(),
  invoicePrefix: z
    .string()
    .max(10, "Prefix must be 10 characters or less")
    .optional(),
  invoiceNextNumber: z.number().int().positive().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  settings: UserSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("settings");

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: settings.name,
      companyName: settings.companyName || "",
      companyAddress: settings.companyAddress || "",
      companyPhone: settings.companyPhone || "",
      companyEmail: settings.companyEmail || "",
      taxId: settings.taxId || "",
      invoicePrefix: settings.invoicePrefix || "INV",
      invoiceNextNumber: settings.invoiceNextNumber || 1,
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    try {
      const result = await updateSettings({
        name: data.name,
        companyName: data.companyName || null,
        companyAddress: data.companyAddress || null,
        companyPhone: data.companyPhone || null,
        companyEmail: data.companyEmail || null,
        taxId: data.taxId || null,
        invoicePrefix: data.invoicePrefix || "INV",
        invoiceNextNumber: data.invoiceNextNumber || 1,
      });

      if (result.success) {
        toast.success(t("saved"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("personalInfo")}</h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("yourName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("placeholders.name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("companyInfo")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("companyInfoDescription")}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("companyName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.companyName")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("companyEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("placeholders.companyEmail")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="companyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("companyAddress")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("placeholders.companyAddress")}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="companyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phoneNumber")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.phone")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("taxId")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.taxId")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("invoiceSettings")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("invoiceSettingsDescription")}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="invoicePrefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("invoicePrefix")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.invoicePrefix")}
                      maxLength={10}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("invoicePrefixDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNextNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nextInvoiceNumber")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 1)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {t("nextInvoiceNumberDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("saveChanges")}
        </Button>
      </form>
    </Form>
  );
}
