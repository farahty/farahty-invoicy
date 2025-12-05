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
import { updateSettings, type OrganizationSettings } from "@/actions/settings";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional(),
  invoicePrefix: z
    .string()
    .max(10, "Prefix must be 10 characters or less")
    .optional(),
  invoiceNextNumber: z.number().int().positive().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface OrganizationSettingsFormProps {
  settings: OrganizationSettings;
}

export function OrganizationSettingsForm({
  settings,
}: OrganizationSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("settings");

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: settings.name,
      address: settings.address || "",
      phone: settings.phone || "",
      email: settings.email || "",
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
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
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
        {/* Organization Name */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
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
        </div>

        {/* Company Details */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
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

          <FormField
            control={form.control}
            name="address"
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
              name="phone"
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
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t("saveChanges")}
        </Button>
      </form>
    </Form>
  );
}
