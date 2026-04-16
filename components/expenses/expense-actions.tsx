"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface ExpenseActionsProps {
  expense: {
    id: string;
    description?: string | null;
  };
}

export function ExpenseActions({ expense }: ExpenseActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteExpense(expense.id);
      if (result.success) {
        toast.success(t("deleted"));
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete expense");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/expenses/${expense.id}`}>
              <Eye className="me-2 h-4 w-4" />
              {tCommon("view")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/expenses/${expense.id}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {tCommon("edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {tCommon("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteExpense")}</AlertDialogTitle>
            <AlertDialogDescription>
              {expense.description
                ? `${t("deleteConfirm")} "${expense.description}"`
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
