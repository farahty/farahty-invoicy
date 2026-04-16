import { notFound } from "next/navigation";
import { getInvoiceByToken } from "@/actions/invoices";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";

interface PublicInvoicePageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicInvoicePage({
  params,
}: PublicInvoicePageProps) {
  const { token } = await params;
  const invoice = await getInvoiceByToken(token);

  if (!invoice) {
    notFound();
  }

  if (!invoice.organizationId) {
    notFound();
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, invoice.organizationId),
  });

  if (!organization) {
    notFound();
  }

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ₪`;
  };

  const discountValue = parseFloat(invoice.discountValue) || 0;
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.rate),
    0
  );
  const rawDiscount =
    invoice.discountType === "percent"
      ? subtotal * (discountValue / 100)
      : discountValue;
  const discountAmount = Math.max(0, Math.min(rawDiscount, subtotal));

  return (
    <div className="space-y-6">
      {/* Org Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {organization.name}
        </h1>
        {organization.address && (
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {organization.address}
          </p>
        )}
        {(organization.phone || organization.email) && (
          <p className="text-muted-foreground text-sm">
            {[organization.phone, organization.email]
              .filter(Boolean)
              .join(" • ")}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Invoice
              </h2>
              <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(invoice.date), "MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Due</p>
              <p className="font-medium">
                {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Bill To */}
          {invoice.client && (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-1">Bill To</p>
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
            </div>
          )}

          {/* Items Table */}
          <div className="border border-border rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                    Qty
                  </th>
                  <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                    Rate
                  </th>
                  <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                    Amount
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
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>
                    Discount
                    {invoice.discountType === "percent"
                      ? ` (${invoice.discountValue}%)`
                      : ""}
                  </span>
                  <span>−{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {parseFloat(invoice.taxRate) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {parseFloat(invoice.amountPaid) > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Paid</span>
                    <span>−{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Balance Due</span>
                    <span>{formatCurrency(invoice.balanceDue)}</span>
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
                    Notes
                  </p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Terms
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

      {/* Download PDF */}
      <div className="flex justify-center">
        <a
          href={`/api/public/invoice/${token}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </a>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        {organization.name}
      </p>
    </div>
  );
}
