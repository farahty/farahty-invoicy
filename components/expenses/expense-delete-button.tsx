"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteExpense } from "@/actions/expenses";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ExpenseDeleteButtonProps {
  expenseId: string;
  description?: string | null;
}

export function ExpenseDeleteButton({
  expenseId,
  description,
}: ExpenseDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteExpense(expenseId);
      if (result.success) {
        toast.success(t("deleted"));
        router.push("/expenses");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete expense");
        setOpen(false);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">{tCommon("delete")}</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteExpense")}</AlertDialogTitle>
            <AlertDialogDescription>
              {description
                ? `${t("deleteConfirm")} "${description}"`
                : t("deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tCommon("loading") : tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
