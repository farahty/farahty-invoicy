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
        toast.success("Settings updated successfully");
      }
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Personal Information</h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Company Information</h3>
          <p className="text-sm text-muted-foreground">
            This information will appear on your invoices
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
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
                  <FormLabel>Company Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="billing@company.com"
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
                <FormLabel>Company Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="123 Main Street&#10;City, State 12345&#10;Country"
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
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
                  <FormLabel>Tax ID / VAT Number</FormLabel>
                  <FormControl>
                    <Input placeholder="XX-XXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Invoice Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure how your invoices are numbered
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="invoicePrefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Prefix</FormLabel>
                  <FormControl>
                    <Input placeholder="INV" maxLength={10} {...field} />
                  </FormControl>
                  <FormDescription>
                    Prefix for invoice numbers (e.g., INV-001)
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
                  <FormLabel>Next Invoice Number</FormLabel>
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
                    The next invoice will use this number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
