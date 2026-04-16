import Link from "next/link";
import { getExpenses } from "@/actions/expenses";
import { getExpenseCategories } from "@/actions/expense-categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Receipt } from "lucide-react";
import { ExpenseSearch } from "@/components/expenses/expense-search";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseActions } from "@/components/expenses/expense-actions";
import { getTranslations } from "next-intl/server";
import { format } from "date-fns";

interface ExpensesPageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

const categoryColors = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
];

function getCategoryColor(name: string): string {
  return categoryColors[name.length % categoryColors.length];
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const { search, categoryId, paymentMethod, dateFrom, dateTo } =
    await searchParams;

  const filters = { search, categoryId, paymentMethod, dateFrom, dateTo };

  const { expenses, total, thisMonth, count } = await getExpenses(filters);
  const categories = await getExpenseCategories();

  const t = await getTranslations("expenses");
  const tCat = await getTranslations("expenseCategories");

  const hasFilters = !!(search || categoryId || paymentMethod || dateFrom || dateTo);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
        </div>
        <Link href="/expenses/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t("newExpense")}
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <ExpenseSearch defaultValue={search} />
        </div>
        <ExpenseFilters
          categories={categories}
          currentCategoryId={categoryId}
          currentPaymentMethod={paymentMethod}
        />
      </div>

      {/* Summary Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("totalFiltered")}</p>
            <p className="text-2xl font-bold text-foreground">
              ₪{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("thisMonth")}</p>
            <p className="text-2xl font-bold text-foreground">
              ₪{thisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("count")}</p>
            <p className="text-2xl font-bold text-foreground">{count.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            {hasFilters ? (
              <>
                <p className="text-muted-foreground mb-2">{t("noResults")}</p>
                <Link href="/expenses">
                  <Button variant="outline">{t("allCategories")}</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  {t("noExpensesDescription")}
                </p>
                <Link href="/expenses/new">
                  <Button>{t("newExpense")}</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block pt-0 overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("date")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("description")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("category")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("client")}
                    </th>
                    <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("amount")}
                    </th>
                    <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const categoryName = expense.category
                      ? expense.category.isDefault
                        ? tCat(expense.category.name as Parameters<typeof tCat>[0])
                        : expense.category.name
                      : "—";
                    const colorClass = expense.category
                      ? getCategoryColor(expense.category.name)
                      : categoryColors[0];

                    return (
                      <tr
                        key={expense.id}
                        className="border-b border-border/50 last:border-0 hover:bg-accent"
                      >
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {expense.description || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
                          >
                            {categoryName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {expense.client?.name || "—"}
                        </td>
                        <td className="py-3 px-4 text-end font-bold text-foreground whitespace-nowrap">
                          ₪{parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <ExpenseActions expense={expense} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4">
            {expenses.map((expense) => {
              const categoryName = expense.category
                ? expense.category.isDefault
                  ? tCat(expense.category.name as Parameters<typeof tCat>[0])
                  : expense.category.name
                : "—";
              const colorClass = expense.category
                ? getCategoryColor(expense.category.name)
                : categoryColors[0];

              return (
                <Card key={expense.id} className="hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {expense.description || "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ms-2 shrink-0">
                        <span className="font-bold text-foreground">
                          ₪{parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <ExpenseActions expense={expense} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
                      >
                        {categoryName}
                      </span>
                      {expense.client?.name && (
                        <span className="text-xs text-muted-foreground">
                          {expense.client.name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
