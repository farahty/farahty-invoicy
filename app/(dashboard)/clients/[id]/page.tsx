import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  FileText,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { ClientActions } from "@/components/clients/client-actions";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusStyles = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
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
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <p className="text-slate-600">Client Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/invoices/new?clientId=${client.id}`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-slate-900 hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-slate-900 hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
            )}
            {(client.address || client.city || client.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="text-slate-900">
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
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">Tax ID / VAT</p>
                <p className="text-slate-900">{client.taxId}</p>
              </div>
            )}
            {client.notes && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">Notes</p>
                <p className="text-slate-900 whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
            <Link href={`/invoices?clientId=${client.id}`}>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {client.invoices.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-4">No invoices yet</p>
                <Link href={`/invoices/new?clientId=${client.id}`}>
                  <Button>Create Invoice</Button>
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
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(invoice.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(invoice.total)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={statusStyles[invoice.status]}
                        >
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
