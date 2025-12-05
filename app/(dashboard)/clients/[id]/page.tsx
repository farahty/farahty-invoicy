import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityActivity } from "@/components/activity/entity-activity";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  FileText,
  Plus,
  Receipt,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-status-info-bg text-status-info-foreground",
  partial: "bg-status-warning-bg text-status-warning-foreground",
  paid: "bg-status-success-bg text-status-success-foreground",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { id } = await params;
  const client = await getClient(id);
  const t = await getTranslations("clients");
  const tInvoices = await getTranslations("invoices");
  const tCommon = await getTranslations("common");

  if (!client) {
    notFound();
  }

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  // Calculate outstanding balance from invoice summary
  const outstandingBalance =
    (client.invoiceSummary?.totalAmount || 0) -
    (client.invoiceSummary?.totalPaid || 0);
  const hasOutstandingBalance = outstandingBalance > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {client.name}
            </h1>
            <p className="text-muted-foreground">{t("clientDetails")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/invoices/new?clientId=${client.id}`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("createInvoice")}
            </Button>
          </Link>
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              {tCommon("edit")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Summary Cards */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center mb-2">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {client.invoiceSummary?.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("totalInvoices")}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center mb-2">
                  <CircleDollarSign className="h-5 w-5 text-status-success-foreground" />
                </div>
                <p className="text-2xl font-bold text-status-success-foreground">
                  {formatCurrency(client.invoiceSummary?.totalPaid || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("totalPaid")}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center mb-2">
                  <AlertCircle
                    className={`h-5 w-5 ${
                      hasOutstandingBalance
                        ? "text-status-warning-foreground"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <p
                  className={`text-2xl font-bold ${
                    hasOutstandingBalance
                      ? "text-status-warning-foreground"
                      : "text-foreground"
                  }`}
                >
                  {formatCurrency(outstandingBalance)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("outstandingBalance")}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(client.invoiceSummary?.totalAmount || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("totalSpent")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t("contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-foreground hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("phone")}</p>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-foreground hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
            )}
            {(client.address || client.city || client.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("address")}
                  </p>
                  <p className="text-foreground">
                    {client.address && (
                      <span>
                        {client.address}
                        <br />
                      </span>
                    )}
                    {[client.city, client.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}
            {client.taxId && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">{t("taxId")}</p>
                <p className="text-foreground">{client.taxId}</p>
              </div>
            )}
            {client.notes && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">{t("notes")}</p>
                <p className="text-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("recentInvoices")}</CardTitle>
            <Link href={`/invoices?clientId=${client.id}`}>
              <Button variant="ghost" size="sm">
                {t("viewAll")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {client.invoices.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  {t("noInvoicesYet")}
                </p>
                <Link href={`/invoices/new?clientId=${client.id}`}>
                  <Button>{t("createInvoice")}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {client.invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                      <div>
                        <p className="font-medium text-foreground">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(invoice.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(invoice.total)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={statusStyles[invoice.status] || ""}
                        >
                          {tInvoices(`statuses.${invoice.status}`)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <EntityActivity entityType="client" entityId={client.id} />
      </div>
    </div>
  );
}
