import { notFound } from "next/navigation";
import Link from "next/link";
import { getExpense } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EntityActivity } from "@/components/activity/entity-activity";
import { ArrowLeft, Edit } from "lucide-react";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import { ExpenseDeleteButton } from "@/components/expenses/expense-delete-button";

interface ExpenseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExpenseDetailPage({
  params,
}: ExpenseDetailPageProps) {
  const { id } = await params;
  const expense = await getExpense(id);
  const t = await getTranslations("expenses");
  const tCat = await getTranslations("expenseCategories");
  const tCommon = await getTranslations("common");
  const tPayments = await getTranslations("payments");

  if (!expense) {
    notFound();
  }

  const formattedAmount = `₪${parseFloat(expense.amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const categoryName = expense.category.isDefault
    ? tCat(expense.category.name as Parameters<typeof tCat>[0])
    : expense.category.name;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {expense.description || t("title")}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(expense.date), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/expenses/${id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">{tCommon("edit")}</span>
            </Button>
          </Link>
          <ExpenseDeleteButton expenseId={id} description={expense.description} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expense Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {expense.description || t("title")}
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  {format(new Date(expense.date), "MMMM d, yyyy")}
                </p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formattedAmount}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            {/* Detail rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("category")}</p>
                <p className="font-medium text-foreground">{categoryName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("paymentMethod")}
                </p>
                <p className="font-medium text-foreground">
                  {expense.paymentMethod
                    ? tPayments(
                        `methods.${expense.paymentMethod}` as Parameters<
                          typeof tPayments
                        >[0]
                      )
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("client")}</p>
                {expense.client ? (
                  <Link
                    href={`/clients/${expense.client.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {expense.client.name}
                  </Link>
                ) : (
                  <p className="font-medium text-foreground">—</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("reference")}</p>
                <p className="font-medium text-foreground">
                  {expense.reference || "—"}
                </p>
              </div>
            </div>

            {expense.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("notes")}
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">
                    {expense.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar — Activity Log */}
        <div className="space-y-6">
          <EntityActivity entityType="expense" entityId={id} />
        </div>
      </div>
    </div>
  );
}
