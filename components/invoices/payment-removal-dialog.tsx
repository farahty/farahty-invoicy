"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  Receipt,
} from "lucide-react";
import type { Payment, PaymentMethod } from "@/db/schema";
import { useTranslations } from "next-intl";

interface PaymentRemovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  currentAmountPaid: number;
  newTotal: number;
  onConfirm: (paymentIdsToRemove: string[]) => Promise<void>;
  isSubmitting: boolean;
}

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  bank_transfer: <Building2 className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  check: <Receipt className="h-4 w-4" />,
  other: <Smartphone className="h-4 w-4" />,
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  card: "Card",
  check: "Check",
  other: "Other",
};

export function PaymentRemovalDialog({
  open,
  onOpenChange,
  payments,
  currentAmountPaid,
  newTotal,
  onConfirm,
  isSubmitting,
}: PaymentRemovalDialogProps) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(
    new Set()
  );

  // Calculate how much needs to be removed
  const excessAmount = currentAmountPaid - newTotal;

  // Calculate the amount that would be removed if selected payments are deleted
  const selectedRemovalAmount = useMemo(() => {
    return payments
      .filter((p) => selectedPaymentIds.has(p.id))
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  }, [payments, selectedPaymentIds]);

  // Calculate remaining amount after removal
  const remainingAmountPaid = currentAmountPaid - selectedRemovalAmount;

  // Check if selection is valid (remaining amount <= new total)
  const isValidSelection = remainingAmountPaid <= newTotal;

  // Check if enough is selected to remove (at minimum, need to remove the excess)
  const isEnoughSelected = selectedRemovalAmount >= excessAmount;

  const formatCurrency = (amount: number) => {
    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  const togglePayment = (paymentId: string) => {
    const newSet = new Set(selectedPaymentIds);
    if (newSet.has(paymentId)) {
      newSet.delete(paymentId);
    } else {
      newSet.add(paymentId);
    }
    setSelectedPaymentIds(newSet);
  };

  const handleConfirm = async () => {
    if (!isValidSelection) return;
    await onConfirm(Array.from(selectedPaymentIds));
  };

  // Reset selection when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedPaymentIds(new Set());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("paymentRemovalRequired")}
          </DialogTitle>
          <DialogDescription>
            {t("paymentRemovalDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
            <div>
              <p className="text-muted-foreground">{t("newInvoiceTotal")}</p>
              <p className="font-semibold text-lg">
                {formatCurrency(newTotal)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("currentAmountPaid")}</p>
              <p className="font-semibold text-lg text-amber-600">
                {formatCurrency(currentAmountPaid)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {t("excessPaymentWarning", {
                amount: formatCurrency(excessAmount),
              })}
            </p>
          </div>

          {/* Payment selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("selectPaymentsToRemove")}</p>
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {payments.map((payment) => (
                <label
                  key={payment.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedPaymentIds.has(payment.id)}
                    onCheckedChange={() => togglePayment(payment.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {paymentMethodIcons[payment.paymentMethod || "cash"]}
                      <span className="font-medium">
                        {formatCurrency(parseFloat(payment.amount))}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {paymentMethodLabels[payment.paymentMethod || "cash"]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                      {payment.reference && ` • ${payment.reference}`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Selection summary */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("amountToRemove")}
              </span>
              <span
                className={
                  selectedRemovalAmount > 0 ? "text-red-600 font-medium" : ""
                }
              >
                -{formatCurrency(selectedRemovalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("remainingPayments")}
              </span>
              <span className="font-medium">
                {formatCurrency(remainingAmountPaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t">
              <span className="text-muted-foreground">
                {t("newBalanceDue")}
              </span>
              <span className="font-semibold">
                {formatCurrency(Math.max(0, newTotal - remainingAmountPaid))}
              </span>
            </div>
          </div>

          {!isValidSelection && selectedPaymentIds.size > 0 && (
            <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10">
              <p className="text-sm text-destructive">
                {t("remainingPaymentsExceedTotal")}
              </p>
            </div>
          )}

          {!isEnoughSelected &&
            selectedPaymentIds.size > 0 &&
            isValidSelection && (
              <div className="p-3 rounded-lg border bg-muted">
                <p className="text-sm text-muted-foreground">
                  {t("selectMorePayments", {
                    amount: formatCurrency(
                      excessAmount - selectedRemovalAmount
                    ),
                  })}
                </p>
              </div>
            )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !isValidSelection || selectedPaymentIds.size === 0 || isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {tCommon("loading")}
              </>
            ) : (
              t("saveAndRemovePayments")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
