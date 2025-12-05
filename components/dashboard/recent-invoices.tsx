import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Invoice, Client } from "@/db/schema";

interface RecentInvoicesProps {
  invoices: (Invoice & { client: Client })[];
}

const statusStyles = {
  draft: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  sent: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  paid: "bg-green-100 text-green-700 hover:bg-green-100",
  overdue: "bg-red-100 text-red-700 hover:bg-red-100",
  cancelled: "bg-slate-100 text-slate-500 hover:bg-slate-100",
};

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">No invoices yet</p>
            <Link href="/invoices/new">
              <Button>Create your first invoice</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Invoices</CardTitle>
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
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
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                  Status
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
                  <td className="py-3 px-4 text-slate-600">
                    {invoice.client.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {format(new Date(invoice.date), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
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
              <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
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
                  <span className="text-slate-500">
                    {format(new Date(invoice.date), "MMM d, yyyy")}
                  </span>
                  <span className="font-semibold text-slate-900">
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
