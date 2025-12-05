"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { sendInvoiceEmail } from "@/actions/invoices";
import { toast } from "sonner";
import type { Invoice, Client, InvoiceItem } from "@/db/schema";
import { useTranslations } from "next-intl";

interface InvoiceStatusActionsProps {
  invoice: Invoice & { client: Client; items: InvoiceItem[] };
}

export function InvoiceStatusActions({ invoice }: InvoiceStatusActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("invoices");

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      const result = await sendInvoiceEmail(invoice.id);
      if (result.success) {
        toast.success(t("sent"));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to send invoice");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Hide actions for paid/cancelled invoices or if client has no email
  if (
    invoice.status === "paid" ||
    invoice.status === "cancelled" ||
    !invoice.client.email
  ) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleSendEmail}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{t("sendInvoice")}</span>
    </Button>
  );
}
