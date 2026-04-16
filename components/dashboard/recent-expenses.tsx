"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Receipt } from "lucide-react";
import { format } from "date-fns";
import type { Expense, ExpenseCategory } from "@/db/schema";
import { useTranslations, useLocale } from "next-intl";

interface RecentExpensesProps {
  expenses: (Expense & { category: ExpenseCategory })[];
}

const categoryColors = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
];

function getCategoryColor(name: string) {
  return categoryColors[name.length % categoryColors.length];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const t = useTranslations();
  const tCat = useTranslations("expenseCategories");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  const getCategoryName = (category: ExpenseCategory) => {
    if (category.isDefault) {
      try {
        return tCat(category.name as Parameters<typeof tCat>[0]);
      } catch {
        return category.name;
      }
    }
    return category.name;
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("dashboard.recentExpenses")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {t("dashboard.noRecentExpenses")}
            </p>
            <Link href="/expenses/new">
              <Button>{t("expenses.newExpense")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {t("dashboard.recentExpenses")}
        </CardTitle>
        <Link href="/expenses">
          <Button variant="ghost" size="sm" className="gap-1">
            {t("dashboard.viewAllExpenses")}
            <ArrowIcon className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("expenses.date")}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("expenses.description")}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("expenses.category")}
                </th>
                <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("expenses.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-border/50 last:border-0 hover:bg-accent"
                >
                  <td className="py-3 px-4 text-muted-foreground">
                    {format(new Date(expense.date), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="font-medium text-foreground hover:text-muted-foreground"
                    >
                      {expense.description || "—"}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category.name)}`}
                    >
                      {getCategoryName(expense.category)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end font-medium text-foreground">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {expenses.map((expense) => (
            <Link
              key={expense.id}
              href={`/expenses/${expense.id}`}
              className="block"
            >
              <div className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {expense.description || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category.name)}`}
                  >
                    {getCategoryName(expense.category)}
                  </span>
                </div>
                <div className="flex items-center justify-end text-sm">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
