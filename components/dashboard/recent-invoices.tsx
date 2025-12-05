"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Invoice, Client } from "@/db/schema";
import { useTranslations, useLocale } from "next-intl";

interface RecentInvoicesProps {
  invoices: (Invoice & { client: Client })[];
}

const statusStyles = {
  draft: "bg-muted text-muted-foreground hover:bg-muted",
  sent: "bg-chart-4/15 text-chart-4 hover:bg-chart-4/20",
  partial: "bg-chart-3/15 text-chart-3 hover:bg-chart-3/20",
  paid: "bg-chart-2/15 text-chart-2 hover:bg-chart-2/20",
  overdue: "bg-destructive/10 text-destructive hover:bg-destructive/15",
  cancelled: "bg-muted text-muted-foreground hover:bg-muted",
};

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  const getStatusLabel = (status: string) => {
    return t(`invoices.statuses.${status}`);
  };

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("dashboard.recentInvoices")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {t("invoices.noInvoices")}
            </p>
            <Link href="/invoices/new">
              <Button>{t("invoices.newInvoice")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {t("dashboard.recentInvoices")}
        </CardTitle>
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="gap-1">
            {t("dashboard.viewAll")}
            <ArrowIcon className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("invoices.invoiceNumber")}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("invoices.client")}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("invoices.date")}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("invoices.amount")}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("invoices.status")}
                </th>
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
                  <td className="py-3 px-4 text-muted-foreground">
                    {invoice.client.name}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {format(new Date(invoice.date), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="secondary"
                      className={statusStyles[invoice.status]}
                    >
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="block"
            >
              <div className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
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
                    {getStatusLabel(invoice.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {format(new Date(invoice.date), "MMM d, yyyy")}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
