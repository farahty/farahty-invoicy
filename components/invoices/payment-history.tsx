"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  Banknote,
  CreditCard,
  Building2,
  FileText,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { deletePayment } from "@/actions/payments";
import type { Payment, PaymentMethod, User } from "@/db/schema";

interface PaymentWithUser extends Payment {
  createdByUser: User | null;
}

interface PaymentHistoryProps {
  payments: PaymentWithUser[];
  invoiceId?: string;
}

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  bank_transfer: <Building2 className="h-4 w-4" />,
  check: <FileText className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const router = useRouter();
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deletePayment(paymentToDelete);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("deleted"));
        router.refresh();
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsDeleting(false);
      setPaymentToDelete(null);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ₪`;
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        {t("noPayments")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                {payment.paymentMethod &&
                  paymentMethodIcons[payment.paymentMethod]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {t(`methods.${payment.paymentMethod || "cash"}`)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                  {payment.reference && (
                    <span className="ms-2">• {payment.reference}</span>
                  )}
                  {payment.createdByUser && (
                    <span className="ms-2">
                      • {t("by")} {payment.createdByUser.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setPaymentToDelete(payment.id)}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {t("deletePayment")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!paymentToDelete}
        onOpenChange={() => setPaymentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePayment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
