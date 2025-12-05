import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Mail,
  Download,
  CheckCircle,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { InvoiceStatusActions } from "@/components/invoices/invoice-status-actions";
import type { InvoiceStatus } from "@/db/schema";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    notFound();
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {invoice.invoiceNumber}
              </h1>
              <Badge
                variant="secondary"
                className={statusStyles[invoice.status]}
              >
                {invoice.status.charAt(0).toUpperCase() +
                  invoice.status.slice(1)}
              </Badge>
            </div>
            <p className="text-slate-600">{invoice.client.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InvoiceStatusActions invoice={invoice} />
          {invoice.status === "draft" && (
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </Link>
          )}
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Invoice
                </h2>
                <p className="text-slate-600">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium">
                  {format(new Date(invoice.date), "MMMM d, yyyy")}
                </p>
                <p className="text-sm text-slate-500 mt-2">Due Date</p>
                <p className="font-medium">
                  {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <p className="text-sm text-slate-500 mb-1">Bill To</p>
              <p className="font-medium text-slate-900">
                {invoice.client.name}
              </p>
              {invoice.client.address && (
                <p className="text-slate-600">{invoice.client.address}</p>
              )}
              {(invoice.client.city || invoice.client.country) && (
                <p className="text-slate-600">
                  {[invoice.client.city, invoice.client.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {invoice.client.email && (
                <p className="text-slate-600">{invoice.client.email}</p>
              )}
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                      Qty
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                      Rate
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="py-3 px-4 text-slate-900">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {parseFloat(item.quantity).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {parseFloat(invoice.taxRate) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({invoice.taxRate}%)</span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                {invoice.notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      Notes
                    </p>
                    <p className="text-slate-600 whitespace-pre-wrap">
                      {invoice.notes}
                    </p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      Terms & Conditions
                    </p>
                    <p className="text-slate-600 whitespace-pre-wrap">
                      {invoice.terms}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/clients/${invoice.client.id}`}
                className="block hover:bg-slate-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
              >
                <p className="font-medium text-slate-900">
                  {invoice.client.name}
                </p>
                {invoice.client.email && (
                  <p className="text-sm text-slate-500">
                    {invoice.client.email}
                  </p>
                )}
              </Link>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-slate-300" />
                  <div>
                    <p className="text-sm text-slate-900">Created</p>
                    <p className="text-xs text-slate-500">
                      {format(
                        new Date(invoice.createdAt),
                        "MMM d, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                </div>
                {invoice.sentAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm text-slate-900">Sent</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(invoice.sentAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                )}
                {invoice.paidAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm text-slate-900">Paid</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(invoice.paidAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
