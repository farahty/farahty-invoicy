import Link from "next/link";
import { getInvoices } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { InvoiceSearch } from "@/components/invoices/invoice-search";
import { InvoiceStatusFilter } from "@/components/invoices/invoice-status-filter";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import type { InvoiceStatus } from "@/db/schema";
import { getTranslations } from "next-intl/server";

interface InvoicesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: InvoiceStatus;
    clientId?: string;
  }>;
}

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground hover:bg-muted",
  sent: "bg-status-info-bg text-status-info-foreground hover:bg-status-info-bg",
  partial:
    "bg-status-warning-bg text-status-warning-foreground hover:bg-status-warning-bg",
  paid: "bg-status-success-bg text-status-success-foreground hover:bg-status-success-bg",
  overdue: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  cancelled: "bg-muted text-muted-foreground hover:bg-muted",
};

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const { search, status, clientId } = await searchParams;
  const invoices = await getInvoices({ search, status, clientId });
  const t = await getTranslations("invoices");

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
        </div>
        <Link href="/invoices/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t("newInvoice")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <InvoiceSearch defaultValue={search} />
        </div>
        <InvoiceStatusFilter currentStatus={status} />
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            {search || status ? (
              <>
                <p className="text-muted-foreground mb-2">{t("noInvoices")}</p>
                <Link href="/invoices">
                  <Button variant="outline">{t("filterByStatus")}</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  {t("noInvoicesDescription")}
                </p>
                <Link href="/invoices/new">
                  <Button>{t("newInvoice")}</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("invoiceNumber")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("client")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("date")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("dueDate")}
                    </th>
                    <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("amount")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("status")}
                    </th>
                    <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border/50 last:border-0 hover:bg-accent"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-foreground hover:text-muted-foreground"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/clients/${invoice.client.id}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {invoice.client.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(invoice.date), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={statusStyles[invoice.status]}
                        >
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <InvoiceActions invoice={invoice} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {invoices.map((invoice) => (
              <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                <Card className="hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.client.name}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={statusStyles[invoice.status]}
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        <span>
                          {format(new Date(invoice.date), "MMM d, yyyy")}
                        </span>
                        <span className="mx-1">•</span>
                        <span>
                          Due {format(new Date(invoice.dueDate), "MMM d")}
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
