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

interface InvoiceActionsProps {
  invoice: Invoice & { client: Client };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteInvoice(invoice.id);
      if (result.success) {
        toast.success("Invoice deleted successfully");
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
        toast.success(`Invoice marked as ${status}`);
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
        toast.success("Invoice sent successfully");
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
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
          {invoice.status === "draft" && (
            <DropdownMenuItem asChild>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              handleDuplicate();
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          {invoice.client.email && invoice.status !== "cancelled" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                handleSendEmail();
              }}
              disabled={isSending}
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSending ? "Sending..." : "Send Email"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Clock className="mr-2 h-4 w-4" />
              Change Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handleStatusChange("draft")}
                disabled={invoice.status === "draft"}
              >
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("sent")}
                disabled={invoice.status === "sent"}
              >
                Sent
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("paid")}
                disabled={invoice.status === "paid"}
              >
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("overdue")}
                disabled={invoice.status === "overdue"}
              >
                Overdue
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("cancelled")}
                disabled={invoice.status === "cancelled"}
              >
                <XCircle className="mr-2 h-4 w-4 text-slate-500" />
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={(e) => {
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice &quot;
              {invoice.invoiceNumber}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
