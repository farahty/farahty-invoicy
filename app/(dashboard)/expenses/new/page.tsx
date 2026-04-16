import { getExpenseCategories } from "@/actions/expense-categories";
import { getClients } from "@/actions/clients";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewExpensePage() {
  const categories = await getExpenseCategories();
  const clients = await getClients();
  const t = await getTranslations("expenses");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {t("newExpense")}
        </h1>
      </div>
      <ExpenseForm categories={categories} clients={clients} />
    </div>
  );
}
