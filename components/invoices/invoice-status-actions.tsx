"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Loader2 } from "lucide-react";
import { updateInvoiceStatus, sendInvoiceEmail } from "@/actions/invoices";
import { toast } from "sonner";
import type { Invoice, Client, InvoiceItem } from "@/db/schema";

interface InvoiceStatusActionsProps {
  invoice: Invoice & { client: Client; items: InvoiceItem[] };
}

export function InvoiceStatusActions({ invoice }: InvoiceStatusActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleMarkAsPaid = async () => {
    setIsLoading("paid");
    try {
      const result = await updateInvoiceStatus(invoice.id, "paid");
      if (result.success) {
        toast.success("Invoice marked as paid");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(null);
    }
  };

  const handleSendEmail = async () => {
    setIsLoading("send");
    try {
      const result = await sendInvoiceEmail(invoice.id);
      if (result.success) {
        toast.success("Invoice sent successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to send invoice");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(null);
    }
  };

  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return null;
  }

  return (
    <div className="flex gap-2">
      {invoice.client.email && (
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleSendEmail}
          disabled={isLoading !== null}
        >
          {isLoading === "send" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {invoice.status === "draft" ? "Send" : "Resend"}
          </span>
        </Button>
      )}
      <Button
        className="gap-2"
        onClick={handleMarkAsPaid}
        disabled={isLoading !== null}
      >
        {isLoading === "paid" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Mark as Paid</span>
      </Button>
    </div>
  );
}
