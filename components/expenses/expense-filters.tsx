"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseCategory } from "@/db/schema";
import { useTranslations } from "next-intl";

interface ExpenseFiltersProps {
  categories: ExpenseCategory[];
  currentCategoryId?: string;
  currentPaymentMethod?: string;
}

export function ExpenseFilters({
  categories,
  currentCategoryId,
  currentPaymentMethod,
}: ExpenseFiltersProps) {
  const router = useRouter();
  const t = useTranslations("expenses");
  const tCat = useTranslations("expenseCategories");

  const paymentMethods: { value: string; label: string }[] = [
    { value: "all", label: t("allMethods") },
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "check", label: "Check" },
    { value: "other", label: "Other" },
  ];

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete("categoryId");
    } else {
      params.set("categoryId", value);
    }
    router.push(`/expenses?${params.toString()}`);
  };

  const handlePaymentMethodChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete("paymentMethod");
    } else {
      params.set("paymentMethod", value);
    }
    router.push(`/expenses?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select
        value={currentCategoryId || "all"}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder={t("allCategories")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allCategories")}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.isDefault ? tCat(category.name as Parameters<typeof tCat>[0]) : category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentPaymentMethod || "all"}
        onValueChange={handlePaymentMethodChange}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder={t("allMethods")} />
        </SelectTrigger>
        <SelectContent>
          {paymentMethods.map((method) => (
            <SelectItem key={method.value} value={method.value}>
              {method.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
