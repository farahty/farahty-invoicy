import { notFound } from "next/navigation";
import { getExpense } from "@/actions/expenses";
import { getExpenseCategories } from "@/actions/expense-categories";
import { getClients } from "@/actions/clients";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const { id } = await params;
  const expense = await getExpense(id);
  const t = await getTranslations("expenses");

  if (!expense) {
    notFound();
  }

  const categories = await getExpenseCategories();
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/expenses/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {t("editExpense")}
        </h1>
      </div>
      <ExpenseForm
        expense={expense}
        categories={categories}
        clients={clients}
      />
    </div>
  );
}
