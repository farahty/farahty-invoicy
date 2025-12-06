"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Copy,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteInvoice,
  updateInvoiceStatus,
  sendInvoiceEmail,
  duplicateInvoice,
} from "@/actions/invoices";
import { toast } from "sonner";
import type { Invoice, Client, InvoiceStatus } from "@/db/schema";
import { useTranslations } from "next-intl";

interface InvoiceActionsProps {
  invoice: Invoice & { client: Client };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteInvoice(invoice.id);
      if (result.success) {
        toast.success(t("deleted"));
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete invoice");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (status: InvoiceStatus) => {
    try {
      const result = await updateInvoiceStatus(invoice.id, status);
      if (result.success) {
        toast.success(t("updated"));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
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
      setIsSending(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const result = await duplicateInvoice(invoice.id);
      if (result.success) {
        toast.success("Invoice duplicated");
        router.push(`/invoices/${result.invoice?.id}`);
      } else {
        toast.error(result.error || "Failed to duplicate invoice");
      }
    } catch {
      toast.error("Something went wrong");
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
            <Link href={`/invoices/${invoice.id}`}>
              <Eye className="me-2 h-4 w-4" />
              {t("invoiceDetails")}
            </Link>
          </DropdownMenuItem>
          {invoice.status !== "cancelled" && (
            <DropdownMenuItem asChild>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Edit className="me-2 h-4 w-4" />
                {tCommon("edit")}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              handleDuplicate();
            }}
          >
            <Copy className="me-2 h-4 w-4" />
            {tCommon("duplicate")}
          </DropdownMenuItem>
          {invoice.client.email && invoice.status !== "cancelled" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                handleSendEmail();
              }}
              disabled={isSending}
            >
              <Mail className="me-2 h-4 w-4" />
              {isSending ? tCommon("loading") : t("sendInvoice")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Clock className="me-2 h-4 w-4" />
              {t("status")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handleStatusChange("draft")}
                disabled={invoice.status === "draft"}
              >
                {t("statuses.draft")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("sent")}
                disabled={invoice.status === "sent"}
              >
                {t("statuses.sent")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("paid")}
                disabled={invoice.status === "paid"}
              >
                <CheckCircle className="me-2 h-4 w-4 text-chart-2" />
                {t("markAsPaid")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("overdue")}
                disabled={invoice.status === "overdue"}
              >
                {t("statuses.overdue")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("cancelled")}
                disabled={invoice.status === "cancelled"}
              >
                <XCircle className="me-2 h-4 w-4 text-muted-foreground" />
                {t("statuses.cancelled")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteInvoice")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? tCommon("loading") : tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
