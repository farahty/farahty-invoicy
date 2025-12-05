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

interface InvoicesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: InvoiceStatus;
    clientId?: string;
  }>;
}

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  sent: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  paid: "bg-green-100 text-green-700 hover:bg-green-100",
  overdue: "bg-red-100 text-red-700 hover:bg-red-100",
  cancelled: "bg-slate-100 text-slate-500 hover:bg-slate-100",
};

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const { search, status, clientId } = await searchParams;
  const invoices = await getInvoices({ search, status, clientId });

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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Invoices
          </h1>
          <p className="text-slate-600 mt-1">Create and manage your invoices</p>
        </div>
        <Link href="/invoices/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Invoice
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
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            {search || status ? (
              <>
                <p className="text-slate-600 mb-2">No invoices found</p>
                <Link href="/invoices">
                  <Button variant="outline">Clear filters</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-slate-600 mb-4">
                  You haven&apos;t created any invoices yet
                </p>
                <Link href="/invoices/new">
                  <Button>Create your first invoice</Button>
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
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Invoice
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Due Date
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-slate-900 hover:text-slate-600"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/clients/${invoice.client.id}`}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          {invoice.client.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {format(new Date(invoice.date), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
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
                <Card className="hover:bg-slate-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-slate-500">
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
                      <div className="text-slate-500">
                        <span>
                          {format(new Date(invoice.date), "MMM d, yyyy")}
                        </span>
                        <span className="mx-1">•</span>
                        <span>
                          Due {format(new Date(invoice.dueDate), "MMM d")}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900">
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
