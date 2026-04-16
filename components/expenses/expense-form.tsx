"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createExpense, updateExpense } from "@/actions/expenses";
import type { Expense, ExpenseCategory, Client, PaymentMethod } from "@/db/schema";
import { useTranslations } from "next-intl";

const expenseFormSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  categoryId: z.string().min(1, "Please select a category"),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  clientId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  expense?: Expense & { category: ExpenseCategory; client: Client | null };
  categories: ExpenseCategory[];
  clients: Client[];
}

const paymentMethods = [
  "cash",
  "card",
  "bank_transfer",
  "check",
  "other",
] as const;

export function ExpenseForm({
  expense,
  categories,
  clients,
}: ExpenseFormProps) {
  const router = useRouter();
  const isEditing = !!expense;
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const tPayments = useTranslations("payments");
  const tCat = useTranslations("expenseCategories");

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: expense
      ? {
          amount: parseFloat(expense.amount),
          date: format(new Date(expense.date), "yyyy-MM-dd"),
          categoryId: expense.categoryId,
          description: expense.description || "",
          paymentMethod: expense.paymentMethod || "",
          clientId: expense.clientId || "",
          reference: expense.reference || "",
          notes: expense.notes || "",
        }
      : {
          amount: 0,
          date: format(new Date(), "yyyy-MM-dd"),
          categoryId: "",
          description: "",
          paymentMethod: "",
          clientId: "",
          reference: "",
          notes: "",
        },
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      const payload = {
        ...data,
        date: new Date(data.date),
        clientId: data.clientId || null,
        paymentMethod: (data.paymentMethod || null) as PaymentMethod | null,
      };

      if (isEditing) {
        const result = await updateExpense(expense.id, payload);
        if (result.success) {
          toast.success(t("updated"));
          router.push(`/expenses/${expense.id}`);
          router.refresh();
        } else {
          toast.error(result.error || "Something went wrong");
        }
      } else {
        const result = await createExpense(payload);
        if (result.success) {
          toast.success(t("created"));
          router.push("/expenses");
          router.refresh();
        } else {
          toast.error(result.error || "Something went wrong");
        }
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Expense Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("expenseDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Amount + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("amount")} *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pe-8"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          ₪
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("date")} *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Category + Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")} *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("selectCategory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.isDefault
                              ? tCat(category.name as Parameters<typeof tCat>[0])
                              : category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("paymentMethod")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("selectPaymentMethod")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {tPayments(`methods.${method}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Description (full width) */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("additionalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Client + Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("client")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("selectClient")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("reference")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Notes (full width) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={form.formState.isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? t("editExpense") : t("newExpense")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
