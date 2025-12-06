import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice } from "@/actions/invoices";
import { getPaymentsByInvoice } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EntityActivity } from "@/components/activity/entity-activity";
import { ArrowLeft, Edit, Download } from "lucide-react";
import { format } from "date-fns";
import { InvoiceStatusActions } from "@/components/invoices/invoice-status-actions";
import { RecordPaymentDialog } from "@/components/invoices/record-payment-dialog";
import { PaymentHistory } from "@/components/invoices/payment-history";
import type { InvoiceStatus } from "@/db/schema";
import { getTranslations } from "next-intl/server";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-chart-4/15 text-chart-4",
  partial: "bg-chart-3/15 text-chart-3",
  paid: "bg-chart-2/15 text-chart-2",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  const t = await getTranslations("invoices");
  const tPayments = await getTranslations("payments");
  const tCommon = await getTranslations("common");

  if (!invoice) {
    notFound();
  }

  const payments = await getPaymentsByInvoice(id);

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  const balanceDue = parseFloat(invoice.balanceDue);
  const hasBalance = balanceDue > 0;
  const canRecordPayment =
    hasBalance && invoice.status !== "cancelled" && invoice.status !== "draft";

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
              <h1 className="text-2xl font-bold text-foreground">
                {invoice.invoiceNumber}
              </h1>
              <Badge
                variant="secondary"
                className={statusStyles[invoice.status]}
              >
                {t(`statuses.${invoice.status}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{invoice.client.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InvoiceStatusActions invoice={invoice} />

          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">{tCommon("edit")}</span>
            </Button>
          </Link>

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
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {t("invoice")}
                </h2>
                <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-muted-foreground">{t("date")}</p>
                <p className="font-medium">
                  {format(new Date(invoice.date), "MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("dueDate")}
                </p>
                <p className="font-medium">
                  {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-1">
                {t("billTo")}
              </p>
              <p className="font-medium text-foreground">
                {invoice.client.name}
              </p>
              {invoice.client.address && (
                <p className="text-muted-foreground">
                  {invoice.client.address}
                </p>
              )}
              {(invoice.client.city || invoice.client.country) && (
                <p className="text-muted-foreground">
                  {[invoice.client.city, invoice.client.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {invoice.client.email && (
                <p className="text-muted-foreground">{invoice.client.email}</p>
              )}
            </div>

            {/* Items Table */}
            <div className="border border-border rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("description")}
                    </th>
                    <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("quantity")}
                    </th>
                    <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("rate")}
                    </th>
                    <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("lineTotal")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="py-3 px-4 text-foreground">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {parseInt(item.quantity)}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
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
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("subtotal")}</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {parseFloat(invoice.taxRate) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {t("tax")} ({invoice.taxRate}%)
                    </span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-foreground">
                  <span>{t("total")}</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                {parseFloat(invoice.amountPaid) > 0 && (
                  <>
                    <div className="flex justify-between text-chart-2">
                      <span>{tPayments("amountPaid")}</span>
                      <span>-{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>{tPayments("balanceDue")}</span>
                      <span
                        className={
                          hasBalance ? "text-destructive" : "text-chart-2"
                        }
                      >
                        {formatCurrency(invoice.balanceDue)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="mt-8 pt-6 border-t border-border space-y-4">
                {invoice.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t("notes")}
                    </p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {invoice.notes}
                    </p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t("terms")}
                    </p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
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
              <CardTitle className="text-lg">{t("client")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/clients/${invoice.client.id}`}
                className="block hover:bg-accent -mx-4 px-4 py-2 rounded-lg transition-colors"
              >
                <p className="font-medium text-foreground">
                  {invoice.client.name}
                </p>
                {invoice.client.email && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.client.email}
                  </p>
                )}
              </Link>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{tPayments("title")}</CardTitle>
              {canRecordPayment && (
                <RecordPaymentDialog
                  invoiceId={invoice.id}
                  balanceDue={invoice.balanceDue}
                />
              )}
            </CardHeader>
            <CardContent>
              <PaymentHistory payments={payments} invoiceId={invoice.id} />
            </CardContent>
          </Card>

          {/* Activity Log */}
          <EntityActivity entityType="invoice" entityId={invoice.id} />
        </div>
      </div>
    </div>
  );
}
